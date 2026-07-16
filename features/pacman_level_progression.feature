Feature: Level Progression
  As a Pac-Man player
  I want to advance to a fresh maze once every dot is cleared
  So that the game keeps going after a maze is fully eaten

  Background:
    Given a new Pac-Man game has started

  Scenario: Eating a single dot does not advance the level
    When 150ms of time passes
    Then the Pac-Man level should be 1

  Scenario: Clearing the last dot advances to the next level
    Given only the dot at the player's position remains
    When 0ms of time passes
    Then the Pac-Man level should be 2
    And the last eat event should be "levelComplete"

  Scenario: Advancing a level refreshes the maze back to a full set of dots
    Given only the dot at the player's position remains
    When 0ms of time passes
    Then the remaining dot count should be restored to a full maze

  Scenario: Advancing a level resets the frightened timer and ghost chain count
    Given the frightened timer is 6000ms
    And ghost 1 is in frightened mode
    And the ghost chain count is 2
    And only the dot at the player's position remains
    When 0ms of time passes
    Then the frightened timer should be 0ms
    And the ghost chain count should be 0
    And ghost 1 should be in scatter mode

  Scenario: Advancing a level resets scatter/chase timing back to scatter
    Given the global mode is chase
    And only the dot at the player's position remains
    When 0ms of time passes
    Then the global mode should be scatter

  Scenario: Advancing a level repositions the player and ghosts back to spawn
    Given the player is at column 3 row 3
    And ghost 1 has moved to column 10 row 4
    And only the dot at the player's position remains
    When 0ms of time passes
    Then the player should be back at the spawn position
    And every ghost should be back at its home position

  Scenario: Level progression preserves accumulated score and remaining lives
    Given the Pac-Man score is 500
    And the Pac-Man lives is 2
    And the player is at column 3 row 3
    And only the dot at the player's position remains
    When 0ms of time passes
    Then the Pac-Man score should be 510
    And the Pac-Man lives should be 2
    And the Pac-Man level should be 2
