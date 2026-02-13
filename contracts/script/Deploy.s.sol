// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/SALToken.sol";
import "../contracts/AgentFactory.sol";
import "../contracts/SpeculationAgentLeague.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        SALToken token = new SALToken();
        console.log("SALToken deployed to:", address(token));

        AgentFactory factory = new AgentFactory();
        console.log("AgentFactory deployed to:", address(factory));

        SpeculationAgentLeague league = new SpeculationAgentLeague(address(token), address(factory));
        console.log("League deployed to:", address(league));

        token.transferOwnership(address(league));
        factory.setLeague(address(league));
        console.log("Ownership configured");

        vm.stopBroadcast();
    }
}
