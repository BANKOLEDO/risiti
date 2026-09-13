// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Structs mirror INativeQueryVerifier on the BlockProver precompile (0xFD2).
// Field order matches the official @gluwa/usc-sdk block_prover ABI exactly.
struct MerkleEntry {
    bytes32 hash;
    bool isLeft;
}
struct MerkleProof {
    bytes32 root;
    MerkleEntry[] siblings;
}
struct ContinuityProof {
    bytes32 lowerEndpointDigest;
    bytes32[] roots;
}

/// @title AttestcoinVerifier — checks Sepolia restock proofs on Creditcoin.
/// Calls the real BlockProver precompile. Reverts unless the proof is real.
contract AttestcoinVerifier {
    address public constant BLOCK_PROVER = 0x0000000000000000000000000000000000000FD2;

    event Verified(uint64 indexed chainKey, uint64 indexed headerNumber, bytes32 indexed txHash, address seller);

    /// @notice Verify + tag a seller. Reverts unless the precompile returns true.
    function verifyAndTag(
        uint64 chainKey,
        uint64 headerNumber,
        bytes calldata txBytes,
        MerkleProof calldata merkleProof,
        ContinuityProof calldata continuityProof,
        address seller
    ) external returns (bool) {
        (bool ok, bytes memory ret) = BLOCK_PROVER.staticcall(
            abi.encodeWithSignature(
                "verify(uint64,uint64,bytes,(bytes32,(bytes32,bool)[]),(bytes32,bytes32[]))",
                chainKey, headerNumber, txBytes, merkleProof, continuityProof
            )
        );
        require(ok && ret.length >= 32 && abi.decode(ret, (bool)), "attestcoin verify failed");
        emit Verified(chainKey, headerNumber, keccak256(txBytes), seller);
        return true;
    }
}
