Feature: Player Movement
  As a Pac-Man player
  I want to move through the maze with responsive, buffered turning
  So that navigation feels predictable

  Background:
    Given a new Pac-Man game has started

  Scenario: Player does not move before the move delay elapses
    When the player sets direction to right
    And 149ms of time passes
    Then the player position should not change

  Scenario: Player moves one cell exactly when the move delay elapses
    When the player sets direction to right
    And 149ms of time passes
    And 1ms of time passes
    Then the player column should increase by 1
    And the player direction should be right

  Scenario: A player with no direction ever set never moves
    When 1000ms of time passes
    Then the player position should not change

  Scenario: A buffered turn succeeds when the new direction is open
    Given the player is at column 5 row 3
    And the player is moving right
    When the player sets direction to down
    And 150ms of time passes
    Then the player direction should be down
    And the player row should increase by 1

  Scenario: A buffered turn fails and the player continues in its current direction
    Given the player is at column 2 row 3
    And the player is moving right
    When the player sets direction to down
    And 150ms of time passes
    Then the player direction should be right
    And the player column should increase by 1

  Scenario: The player stops when its direction is blocked and no turn is buffered
    Given the player is at column 1 row 3
    And the player is moving left
    When 150ms of time passes
    Then the player position should not change
    And the player direction should be left

  Scenario: The tunnel wraps the player from the left edge to the right edge
    Given the player is at column 0 row 7
    And the player is moving left
    When 150ms of time passes
    Then the player column should be 14
    And the player row should be 7

  Scenario: The tunnel wraps the player from the right edge to the left edge
    Given the player is at column 14 row 7
    And the player is moving right
    When 150ms of time passes
    Then the player column should be 0
    And the player row should be 7
