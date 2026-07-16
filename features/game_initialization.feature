Feature: Game Initialization
  As a Tetris player
  I want the game to start in a known state
  So that I can play consistently

  Background:
    Given a new game has started

  Scenario: Game starts with score 0
    Then the score should be 0

  Scenario: Game starts with level 1
    Then the level should be 1

  Scenario: Game starts with lines cleared 0
    Then the lines cleared should be 0

  Scenario: Game board is empty
    Then the board should be empty
    And all cells should be null

  Scenario: First piece spawns in valid position
    Then a piece should be active
    And the piece y position should be 0
    And the piece x position should be centered

  Scenario: Next piece preview is generated
    Then a next piece should be visible
    And the next piece should be a valid tetromino type

  Scenario: Game is not paused
    Then the game should not be paused

  Scenario: Game is not over
    Then the game should not be over

  Scenario: Current piece is not null
    Then the current piece should exist
    And the current piece should be a valid tetromino

  Scenario: Piece is one of 7 valid types
    When a new game starts
    Then the current piece should be one of: I, O, T, S, Z, J, L
    And the next piece should be one of: I, O, T, S, Z, J, L
