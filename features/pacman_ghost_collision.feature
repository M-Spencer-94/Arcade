Feature: Ghost Collisions
  As a Pac-Man player
  I want colliding with a ghost to matter differently depending on its mode
  So that eating frightened ghosts is rewarded and dangerous ghosts cost lives

  Background:
    Given a new Pac-Man game has started

  Scenario: Colliding with a ghost in scatter mode costs a life
    Given ghost 1 is at the player's position in scatter mode
    When ghost collisions are processed
    Then the Pac-Man lives should decrease by 1
    And the last eat event should be "death"

  Scenario: Colliding with a ghost in chase mode costs a life
    Given ghost 1 is at the player's position in chase mode
    When ghost collisions are processed
    Then the Pac-Man lives should decrease by 1

  Scenario: Colliding with an eaten ghost has no effect
    Given ghost 1 is at the player's position in eaten mode
    When ghost collisions are processed
    Then the Pac-Man lives should not change
    And the Pac-Man score should not change

  Scenario: No collision occurs when no ghost shares the player's tile
    When ghost collisions are processed
    Then the Pac-Man lives should not change

  Scenario: Colliding with a frightened ghost scores points and marks it eaten
    Given ghost 1 is at the player's position in frightened mode
    When ghost collisions are processed
    Then the Pac-Man score should increase by 200
    And ghost 1 should be in eaten mode
    And the ghost chain count should increase by 1
    And the last eat event should be "ghost"

  Scenario: Losing a life with lives remaining resets the player and ghosts to their spawn points
    Given the player is at column 5 row 5
    And ghost 1 is at the player's position in scatter mode
    When ghost collisions are processed
    Then the player should be back at the spawn position
    And every ghost should be back at its home position

  Scenario: Losing the last life ends the game without resetting positions
    Given the Pac-Man lives is 1
    And the player is at column 5 row 5
    And ghost 1 is at the player's position in scatter mode
    When ghost collisions are processed
    Then the Pac-Man game should be over
    And the player should not be back at the spawn position
