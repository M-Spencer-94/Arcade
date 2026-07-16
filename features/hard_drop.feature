Feature: Hard Drop
  As a Tetris player
  I want to instantly place pieces at the bottom
  So that I can quickly position pieces without waiting

  Background:
    Given a new game has started

  Scenario: Hard drop places piece at bottom instantly
    When the player hard drops
    Then the piece should move to its final landing position
    And the piece should lock immediately

  Scenario: Hard drop scores 2 points per row moved
    Given the board is empty
    And the current piece is an I tetromino
    When the player hard drops
    Then the score should increase according to the hard drop formula

  Scenario: Hard drop locks the piece
    When the player hard drops
    Then the current piece should be locked
    And a new piece should spawn

  Scenario: Cannot hard drop when paused
    Given the game is paused
    When the player hard drops
    Then the piece should not move or lock

  Scenario: Cannot hard drop after game over
    Given the game is over
    When the player hard drops
    Then the piece should not move or lock

  Scenario: Hard drop at bottom doesn't move
    Given the piece is already at the bottom
    When the player hard drops
    Then the piece should lock
    And the score should not increase from the drop

  Scenario: Hard drop triggers line clear
    Given the board is set up for a line clear with hard drop
    When the player hard drops
    Then lines should be cleared
    And score should include both hard drop and line clear points
