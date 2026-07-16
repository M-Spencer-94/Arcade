Feature: Game Over
  As a Tetris player
  I want the game to end when pieces stack to the top
  So that I know when I've failed

  Background:
    Given a new game has started

  Scenario: Game over triggered when piece spawns into collision
    Given the board is nearly full
    When the player hard drops multiple times until the top is full
    Then game over should be triggered
    And the isGameOver flag should be true

  Scenario: Cannot move after game over
    Given the game is over
    When the player moves left
    Then the piece should not move
    And the piece position should not change

  Scenario: Cannot move right after game over
    Given the game is over
    When the player moves right
    Then the piece should not move
    And the piece position should not change

  Scenario: Cannot rotate after game over
    Given the game is over
    When the player rotates the piece
    Then the rotation state should not change

  Scenario: Cannot soft drop after game over
    Given the game is over
    When the player soft drops
    Then the piece should not move

  Scenario: Cannot hard drop after game over
    Given the game is over
    When the player hard drops
    Then the piece should not move

  Scenario: Gravity does nothing after game over
    Given the game is over
    When time passes
    Then the piece should not fall

  Scenario: Reset clears the board
    Given the game is over
    When the player resets the game
    Then the board should be empty
    And all cells should be null

  Scenario: Reset returns to initial state
    Given the game is over
    When the player resets the game
    Then the score should be 0
    And the level should be 1
    And the lines cleared should be 0
    And the isGameOver flag should be false

  Scenario: Reset spawns a new piece
    Given the game is over
    When the player resets the game
    Then a new current piece should exist
    And a new next piece should exist
