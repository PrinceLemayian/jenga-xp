// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title JengaBadge
 * @notice Soulbound NFT Badges minted when members reach milestone levels in Jenga XP.
 * Transfers are permanently disabled.
 */
contract JengaBadge is ERC721 {
    address public jengaXPContract;
    uint256 private _tokenIdCounter;

    mapping(uint256 => uint8) public tokenLevel;
    mapping(address => mapping(uint8 => uint256)) public memberBadge;
    mapping(address => mapping(uint8 => bool)) public hasBadge;

    string[6] public LEVEL_NAMES = [
        "",
        "Newcomer",
        "Regular",
        "Contributor",
        "Veteran",
        "Legend"
    ];

    event BadgeMinted(address indexed member, uint8 level, uint256 tokenId);
    event JengaXPContractSet(address indexed jengaXPContract);

    error OnlyJengaXPAllowed();
    error AlreadySet();
    error BadgeAlreadyMinted();
    error InvalidLevel();
    error SoulboundTransferBlocked();

    constructor() ERC721("Jenga XP Badge", "JXPB") {}

    function setJengaXPContract(address _contract) external {
        if (jengaXPContract != address(0)) revert AlreadySet();
        require(_contract != address(0), "Invalid address");
        jengaXPContract = _contract;
        emit JengaXPContractSet(_contract);
    }

    function mint(address _to, uint8 _level) external {
        if (msg.sender != jengaXPContract) revert OnlyJengaXPAllowed();
        if (_level < 1 || _level > 5) revert InvalidLevel();
        if (hasBadge[_to][_level]) revert BadgeAlreadyMinted();

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_to, tokenId);
        tokenLevel[tokenId] = _level;
        memberBadge[_to][_level] = tokenId;
        hasBadge[_to][_level] = true;

        emit BadgeMinted(_to, _level, tokenId);
    }

    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundTransferBlocked();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert SoulboundTransferBlocked();
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint8 level = tokenLevel[tokenId];
        string memory levelName = level <= 5 ? LEVEL_NAMES[level] : "Unknown";

        return string(abi.encodePacked(
            unicode'data:application/json;utf8,{',
            unicode'"name":"Jenga XP - ', levelName, ' Badge",',
            unicode'"description":"Proof of community participation on Avalanche.",',
            unicode'"attributes":[{"trait_type":"Level","value":', _uintToString(level), '},',
            unicode'{"trait_type":"Level Name","value":"', levelName, '"}]',
            '}'
        ));
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function _uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 temp = v;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (v != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + v % 10));
            v /= 10;
        }
        return string(buffer);
    }
}
