// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./RisitiRegistry.sol";

/// @title RisitiPool — community advances, unlocked by standing.
/// Members fund one pot. Traders with enough score draw short advances.
/// Zero interest, 7 days. Demo funds with tCTC on Creditcoin testnet.
contract RisitiPool {
    RisitiRegistry public registry;
    uint256 public pot;
    uint256 public constant TENOR = 7 days;

    struct Advance {
        address borrower;
        uint256 amount;
        uint64 dueAt;
        bool repaid;
        bool settled;
    }
    Advance[] public advances;
    mapping(address => uint256) public contributed;
    mapping(address => uint256) public activeAdvance;

    event Funded(address indexed from, uint256 amount);
    event Advanced(uint256 indexed id, address indexed to, uint256 amount, uint64 dueAt);
    event Repaid(uint256 indexed id, address indexed by);
    event Defaulted(uint256 indexed id, address indexed borrower);

    constructor(address registryAddr) {
        registry = RisitiRegistry(registryAddr);
    }

    function fund() external payable {
        require(msg.value > 0, "zero");
        pot += msg.value;
        contributed[msg.sender] += msg.value;
        emit Funded(msg.sender, msg.value);
    }

    function draw(uint256 amount) external {
        require(activeAdvance[msg.sender] == 0, "active advance");
        uint256 limit = registry.advanceLimit(msg.sender);
        require(limit > 0, "build receipts first");
        require(amount <= limit, "over limit");
        require(amount <= pot, "pot dry");
        pot -= amount;
        activeAdvance[msg.sender] = advances.length + 1;
        advances.push(Advance({borrower: msg.sender, amount: amount, dueAt: uint64(block.timestamp + TENOR), repaid: false, settled: false}));
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "send fail");
        emit Advanced(advances.length - 1, msg.sender, amount, uint64(block.timestamp + TENOR));
    }

    function repay() external payable {
        uint256 aid = activeAdvance[msg.sender];
        require(aid != 0, "none");
        Advance storage a = advances[aid - 1];
        require(!a.settled, "settled");
        require(msg.value >= a.amount, "short");
        a.repaid = true;
        a.settled = true;
        pot += a.amount;
        activeAdvance[msg.sender] = 0;
        // overpay returns change
        if (msg.value > a.amount) {
            (bool ok, ) = msg.sender.call{value: msg.value - a.amount}("");
            require(ok, "refund fail");
        }
        emit Repaid(aid - 1, msg.sender);
    }

    function markDefault(uint256 aid) external {
        Advance storage a = advances[aid];
        require(!a.settled, "settled");
        require(block.timestamp > a.dueAt, "not due");
        a.settled = true;
        activeAdvance[a.borrower] = 0;
        emit Defaulted(aid, a.borrower);
    }

    function advanceCount() external view returns (uint256) {
        return advances.length;
    }
}
