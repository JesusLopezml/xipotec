//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract JesusToken is ERC20, Ownable, ERC20Permit {
    constructor(address initialOwner)
        ERC20("JesusToken", "JESUS")
        Ownable(initialOwner)
        ERC20Permit("JesusToken")
    {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}