Feature: Collision Detection
  As a Tetris player
  I want pieces to collide with walls, floors, and locked pieces
  So that the game physics work correctly

  Background:
    Given a new game has started

  Scenario: Piece cannot move past left wall
    When the player moves left 10 times
    Then the piece should be at column 0

  Scenario: Piece cannot move past right wall
    When the player moves right 10 times
    Then the piece should be at its rightmost valid column

  Scenario: Piece collides with floor
    When the player hard drops
    Then the piece should lock

  Scenario: Piece collides with locked pieces
    Given the board has locked pieces at column 2
    And the current piece is positioned at column 3
    When the player tries to move into a locked piece
    Then the piece should not move into the locked pieces

  Scenario: Game over when piece spawns into collision
    Given the board is nearly full
    When the player hard drops multiple times until the top is full
    Then game over should be triggered

  Scenario: Wall kick resolves collision on left
    Given the current piece is an I tetromino
    And the piece is at the right edge
    When the player rotates the piece
    Then the piece should shift left
    And the rotation should succeed

  Scenario: Wall kick resolves collision on right
    Given the current piece is an I tetromino
    And the piece is at the left edge
    When the player rotates the piece
    Then the piece should shift right
    And the rotation should succeed

  Scenario: Rotation fails when wall kick cannot resolve
    Given the current piece is a tetromino
    And the piece is completely blocked from rotating
    When the player rotates the piece
    Then the rotation should fail
    And the piece should remain in original position

  Scenario: No collision in empty space
    When the player moves left
    Then the piece should move successfully
    And no collision should be detected
