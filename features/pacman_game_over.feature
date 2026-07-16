Feature: Game Over, Pause and Reset
  As a Pac-Man player
  I want the game to stop responding once it's paused or over, and reset cleanly
  So that the game state always behaves predictably

  Background:
    Given a new Pac-Man game has started

  Scenario: The game does not update while paused
    Given the Pac-Man game is paused
    When 1000ms of time passes
    Then the player position should not change
    And the Pac-Man score should not change

  Scenario: The game does not update once it is over
    Given the Pac-Man game is over
    When 1000ms of time passes
    Then the player position should not change
    And the Pac-Man score should not change

  Scenario: Toggling pause twice returns to an unpaused state
    When the Pac-Man player toggles pause
    Then the Pac-Man game should be paused
    When the Pac-Man player toggles pause
    Then the Pac-Man game should not be paused

  Scenario: Losing all lives sets the game-over flag
    Given the Pac-Man lives is 1
    And ghost 1 is at the player's position in scatter mode
    When ghost collisions are processed
    Then the Pac-Man game should be over

  Scenario: Losing a life with lives remaining keeps the game going
    Given ghost 1 is at the player's position in scatter mode
    When ghost collisions are processed
    Then the Pac-Man game should not be over
    And the Pac-Man lives should decrease by 1

  Scenario: Resetting restores a clean game state
    Given the Pac-Man score is 500
    And the Pac-Man lives is 1
    And the player is at column 3 row 3
    And ghost 1 has moved to column 9 row 9
    And the ghost chain count is 2
    And the frightened timer is 6000ms
    And the global mode is chase
    And the Pac-Man game is over
    When the player resets the Pac-Man game
    Then the Pac-Man score should be 0
    And the Pac-Man lives should be 3
    And the Pac-Man level should be 1
    And the Pac-Man game should not be over
    And the Pac-Man game should not be paused
    And the player should be back at the spawn position
    And every ghost should be back at its home position
    And the global mode should be scatter
    And the ghost chain count should be 0
    And the frightened timer should be 0ms
