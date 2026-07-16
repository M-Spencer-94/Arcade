Feature: Scoring
  As a Tetris player
  I want to earn points for clearing lines
  So that I can track my performance

  Background:
    Given a new game has started
    And the score is 0

  Scenario: Single line clear scores 100 × level
    Given the board is set up for a single line clear
    And the level is 1
    When the player hard drops
    Then the score should increase by 100

  Scenario: Double line clear scores 300 × level
    Given the board is set up for a double line clear
    And the level is 1
    When the player hard drops
    Then the score should increase by 300

  Scenario: Triple line clear scores 500 × level
    Given the board is set up for a triple line clear
    And the level is 1
    When the player hard drops
    Then the score should increase by 500

  Scenario: 4-line Tetris scores 800 × level
    Given the board is set up for a 4-line clear
    And the level is 1
    When the player hard drops
    Then the score should increase by 800

  Scenario: Score multiplies by level
    Given the board is set up for a single line clear
    And the level is 3
    When the player hard drops
    Then the score should increase by 300

  Scenario: Soft drop adds 1 point per block
    When the player soft drops 1 row
    Then the score should increase by 1

  Scenario: Hard drop adds 2 points per row moved
    Given the board is empty
    And the current piece is an I tetromino
    When the player hard drops
    Then the score should increase according to the hard drop formula

  Scenario: Multiple clears accumulate score
    Given the board is nearly full
    When the player clears 3 lines then 2 lines
    Then total score should accumulate correctly

  Scenario: Score persists across moves
    When the player soft drops, then moves, then soft drops again
    Then the score should accumulate correctly
