Feature: Piece Rotation
  As a Tetris player
  I want to rotate pieces
  So that I can fit them into different orientations

  Background:
    Given a new game has started

  Scenario: Rotate piece clockwise
    When the player rotates the piece 1 time
    Then the rotation state should be 1

  Scenario: Rotation cycles through 4 states
    When the player rotates the piece 4 times
    Then the rotation state should be 0

  Scenario: Rotation cycles through all states
    Given the current piece is not an O tetromino
    When the player rotates the piece multiple times
    Then rotation state should cycle through all states

  Scenario: Cannot rotate when paused
    Given the game is paused
    When the player rotates the piece
    Then the rotation state should not change

  Scenario: Cannot rotate after game over
    Given the game is over
    When the player rotates the piece
    Then the rotation state should not change

  Scenario: Wall kick left resolves collision
    Given the current piece is an I tetromino
    And the piece is at the right edge
    When the player rotates the piece
    Then the piece should shift left
    And the rotation should succeed

  Scenario: Wall kick right resolves collision
    Given the current piece is an I tetromino
    And the piece is at the left edge
    When the player rotates the piece
    Then the piece should shift right
    And the rotation should succeed

  Scenario: Rotation reverts when wall kick fails
    Given the piece is completely blocked from rotating
    When the player rotates the piece
    Then the rotation should revert to original state
    And the piece position should not change

  Scenario: All 7 piece types can rotate
    When the player tests rotation for each piece type
    Then each piece type should rotate successfully
    And rotation state should cycle correctly

  Scenario: O piece rotation has no effect
    Given the current piece is an O tetromino
    When the player rotates the piece
    Then the piece shape should remain unchanged
