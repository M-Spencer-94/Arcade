Feature: Game Engine Edge Cases
  As a developer
  I want the underlying board and piece mechanics to behave correctly
  at boundary conditions
  So that gameplay stays correct in unusual situations

  Scenario: A piece with blocks above the board only locks the in-bounds blocks
    Given a tetromino positioned partially above the board
    When the tetromino is locked onto an empty board
    Then only the in-bounds blocks should be written to the board

  Scenario: isGameOver ignores blocks below the board
    Given a tetromino positioned entirely below the board
    Then the board should not consider it game over

  Scenario: isGameOver ignores blocks above the board
    Given a tetromino positioned entirely above the board
    Then the board should not consider it game over

  Scenario: A fresh board is never colliding for a centered piece
    Given a fresh board and a centered tetromino
    Then no collision should be detected for that tetromino

  Scenario: isColliding defaults to checking the piece's current position
    Given a fresh board and a centered tetromino
    Then no collision should be detected for that tetromino with no offset given
