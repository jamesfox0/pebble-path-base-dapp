// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PebblePath {
    uint256 public nextPebbleId = 1;

    struct Pebble {
        address maker;
        string title;
        string colorName;
        string note;
        string weight;
        uint256 createdAt;
    }

    mapping(uint256 => Pebble) private pebbles;

    event PebbleDropped(
        uint256 indexed pebbleId,
        address indexed maker,
        string title,
        string colorName
    );

    function dropPebble(
        string calldata title,
        string calldata colorName,
        string calldata note,
        string calldata weight
    ) external returns (uint256 pebbleId) {
        require(bytes(title).length > 0 && bytes(title).length <= 36, "Invalid title");
        require(bytes(colorName).length > 0 && bytes(colorName).length <= 24, "Invalid color");
        require(bytes(note).length > 0 && bytes(note).length <= 128, "Invalid note");
        require(bytes(weight).length > 0 && bytes(weight).length <= 18, "Invalid weight");

        pebbleId = nextPebbleId++;
        pebbles[pebbleId] = Pebble({
            maker: msg.sender,
            title: title,
            colorName: colorName,
            note: note,
            weight: weight,
            createdAt: block.timestamp
        });

        emit PebbleDropped(pebbleId, msg.sender, title, colorName);
    }

    function getPebble(
        uint256 pebbleId
    )
        external
        view
        returns (
            address maker,
            string memory title,
            string memory colorName,
            string memory note,
            string memory weight,
            uint256 createdAt
        )
    {
        Pebble storage entry = pebbles[pebbleId];
        return (
            entry.maker,
            entry.title,
            entry.colorName,
            entry.note,
            entry.weight,
            entry.createdAt
        );
    }
}
