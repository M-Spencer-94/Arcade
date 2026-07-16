Feature: Level Progression
  As a Tetris player
  I want difficulty to increase as I progress
  So that the game gets harder as I clear more lines

  Background:
    Given a new game has started
    And the level is 1
    And the lines cleared is 0

  Scenario: Level increases every 10 lines cleared
    When the player clears 10 lines
    Then the level should be 2

  Scenario: Level 2 increases to level 3 after 10 more lines
    Given the level is 2
    And 10 lines have been cleared
    When the player clears 10 more lines
    Then the level should be 3

  Scenario: Gravity delay decreases with level
    Given the level is 1
    Then the gravity delay should be 800ms
    When the level increases to 2
    Then the gravity delay should be 750ms

  Scenario: Gravity delay formula matches expected values across levels
    When the level is set to several representative values
    Then the gravity delay should match the formula at each level

  Scenario: Gravity delay is capped at 100ms
    Given the level is 15
    Then the gravity delay should be 100ms
    And increasing level should not decrease delay further

  Scenario: Level 1 gravity is 800ms
    Given a new game has started
    Then the gravity delay should be 800ms

  Scenario: Level 2 gravity is 750ms
    Given the level is 2
    Then the gravity delay should be 750ms

  Scenario: Level 5 gravity is 600ms
    Given the level is 5
    Then the gravity delay should be 600ms

  Scenario: A small amount of time passing does not trigger gravity
    When a small amount of time passes
    Then the piece should not fall

  Scenario: Gravity locks the piece when it cannot fall further
    Given the piece is already at the bottom
    When time passes
    Then the piece should lock

  Scenario: A clear that triggers a level-up still scores at the old level
    Given the lines cleared is 9
    And the level is 1
    And the board is set up for a single line clear
    When the player hard drops
    Then the score should increase by 100
    And the level should be 2
