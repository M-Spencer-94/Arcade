Feature: Dot and Power Pellet Collection
  As a Pac-Man player
  I want to score points for eating dots and power pellets
  So that clearing the maze feels rewarding

  Background:
    Given a new Pac-Man game has started

  Scenario: Eating a dot scores 10 points
    When the game processes eating at the player's position
    Then the Pac-Man score should increase by 10
    And the last eat event should be "dot"
    And the remaining dot count should decrease by 1

  Scenario: Standing on an already-eaten cell scores nothing
    Given the cell at the player's position has no dot
    When the game processes eating at the player's position
    Then the Pac-Man score should not change
    And the last eat event should be null
    And the remaining dot count should not change

  Scenario: Eating a power pellet scores 50 points and frightens every ghost
    Given the player is at column 1 row 1
    When the game processes eating at the player's position
    Then the Pac-Man score should increase by 50
    And the last eat event should be "power"
    And the frightened timer should be 6000ms
    And every ghost should be in frightened mode

  Scenario: Eating a power pellet resets an in-progress ghost chain
    Given the ghost chain count is 3
    And the player is at column 1 row 1
    When the game processes eating at the player's position
    Then the ghost chain count should be 0

  Scenario: Eating a power pellet does not re-frighten an already-eaten ghost
    Given ghost 1 is in eaten mode
    And the player is at column 1 row 1
    When the game processes eating at the player's position
    Then ghost 1 should be in eaten mode
    And ghost 2 should be in frightened mode
