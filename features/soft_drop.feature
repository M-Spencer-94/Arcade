Feature: Soft Drop
  As a Tetris player
  I want to accelerate pieces downward with soft drop
  So that I can control when pieces land

  Background:
    Given a new game has started

  Scenario: Soft drop moves piece down 1 row
    When the player soft drops
    Then the piece y position should increase by 1

  Scenario: Soft drop adds 1 to score per row
    When the player soft drops
    Then the score should increase by 1

  Scenario: Multiple soft drops accumulate score
    When the player soft drops 5 times
    Then the score should increase by 5

  Scenario: Soft drop at bottom locks the piece
    When the player soft drops until hitting the floor
    Then the piece should lock
    And a new piece should spawn

  Scenario: Cannot soft drop when paused
    Given the game is paused
    When the player soft drops
    Then the piece y position should not change

  Scenario: Cannot soft drop after game over
    Given the game is over
    When the player soft drops
    Then the piece y position should not change

  Scenario: Soft drop blocked by locked pieces
    Given the board has locked pieces below
    When the player soft drops
    Then the piece should lock
    And the piece should not pass through locked pieces

  Scenario: Resume allows soft drop
    Given the game is paused
    When the game is resumed
    And the player soft drops
    Then the piece y position should change
    And score should increase
