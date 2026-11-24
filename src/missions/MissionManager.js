import * as THREE from 'three';
import { sound } from '../audio/SoundEngine.js';

/**
 * MissionManager - Manages the central cybercrime thriller storyline.
 * "Operation Cyber Fortress" - 3 high-stakes open-world cybersecurity operations across Mumbai.
 */
export class MissionManager {
  constructor(scene, objectiveTracker, playerController, wantedSystem) {
    this.scene = scene;
    this.tracker = objectiveTracker;
    this.player = playerController;
    this.wanted = wantedSystem;

    this.currentMissionIndex = 0;
    this.missions = [
      {
        id: 'mission_1',
        title: 'OPERATION 1: APOLLO BUNDER HARBOUR TAP',
        desc: 'Infiltrate rogue submarine cable optic tap at the Gateway of India harbour wall before maritime patrol units scan the frequency.',
        target: new THREE.Vector3(65.0, 0.35, 600.0),
        reward: 5000,
        status: 'ready'
      },
      {
        id: 'mission_2',
        title: 'OPERATION 2: DADAR CHAWL SYNDICATE DEN',
        desc: 'Locate the underground cyber syndicate command server hidden in the Dadar Chawls and decrypt the payload.',
        target: new THREE.Vector3(-40.0, 0.1, -170.0),
        reward: 12000,
        status: 'locked'
      },
      {
        id: 'mission_3',
        title: 'OPERATION 3: SEA LINK EXPRESSWAY INTERCEPT',
        desc: 'Intercept the exfiltration courier convoy racing across the Bandra-Worli Sea Link bridge before data escapes to Bandra.',
        target: new THREE.Vector3(-180.0, 15.2, -45.0),
        reward: 35000,
        status: 'locked'
      }
    ];

    this.activeMission = null;
    this.onMissionStateChange = null;
  }

  startCurrentMission() {
    this.activeMission = this.missions[this.currentMissionIndex];
    this.activeMission.status = 'active';
    this.tracker.setWaypoint(
      this.activeMission.target.x,
      this.activeMission.target.y,
      this.activeMission.target.z
    );
    sound.playMissionSuccess();
    if (this.onMissionStateChange) {
      this.onMissionStateChange(this.activeMission);
    }
  }

  update(delta) {
    if (!this.activeMission || this.activeMission.status !== 'active') return;

    // Check distance between player and target waypoint
    const dist = this.player.position.distanceTo(this.activeMission.target);
    if (dist < 4.5) {
      this.completeMission();
    }
  }

  completeMission() {
    if (!this.activeMission) return;
    this.activeMission.status = 'completed';
    this.player.cash += this.activeMission.reward;
    sound.playMissionSuccess();
    this.tracker.clearWaypoint();

    const completedTitle = this.activeMission.title;
    this.currentMissionIndex++;
    if (this.currentMissionIndex < this.missions.length) {
      this.activeMission = null;
      if (this.onMissionStateChange) {
        this.onMissionStateChange({
          title: `COMPLETED: ${completedTitle}!`,
          desc: `Awarded ₹${this.missions[this.currentMissionIndex - 1].reward}. Open Smartphone (M) for next brief.`
        });
      }
    } else {
      if (this.onMissionStateChange) {
        this.onMissionStateChange({
          title: `CAMPAIGN ACCOMPLISHED: MUMBAI IS SECURE!`,
          desc: `All cybercrime syndicates neutralized by PiSecOps. Open-world sandbox unlocked!`
        });
      }
    }
  }

  getActiveObjectiveText() {
    if (!this.activeMission || this.activeMission.status !== 'active') {
      return 'EXPLORE MUMBAI // PRESS [M] FOR CYBER SMARTPHONE';
    }
    const dist = Math.round(this.player.position.distanceTo(this.activeMission.target));
    return `${this.activeMission.title} [${dist}m]`;
  }
}
