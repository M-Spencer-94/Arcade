Feature: Piece Movement
  As a Tetris player
  I want to move pieces left and right
  So that I can position them correctly before they land

  Background:
    Given a new game has started

  Scenario: Move piece left
    When the player moves left
    Then the piece x position should decrease by 1

  Scenario: Move piece right
    When the player moves right
    Then the piece x position should increase by 1

  Scenario: Move left at left boundary
    When the player moves left 10 times
    Then the piece should be at column 0
    And x position should not go below 0

  Scenario: Move right at right boundary
    When the player moves right 10 times
    Then the piece should be at its rightmost valid column

  Scenario: Cannot move left when paused
    Given the game is paused
    When the player moves left
    Then the piece position should not change

  Scenario: Cannot move right when paused
    Given the game is paused
    When the player moves right
    Then the piece position should not change

  Scenario: Cannot move left after game over
    Given the game is over
    When the player moves left
    Then the piece position should not change

  Scenario: Cannot move right after game over
    Given the game is over
    When the player moves right
    Then the piece position should not change

  Scenario: Cannot move into locked pieces
    Given the board has locked pieces at column 2
    And the current piece is positioned at column 3
    When the player moves left
    Then the piece should not move into the locked pieces
    And the piece should remain at column 3

  Scenario: Resume allows movement
    Given the game is paused
    When the game is resumed
    And the player moves left
    Then the piece position should change
