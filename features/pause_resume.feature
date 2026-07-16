Feature: Pause and Resume
  As a Tetris player
  I want to pause and resume the game
  So that I can take a break without losing progress

  Background:
    Given a new game has started

  Scenario: Toggle pause flips isPaused state
    When the player toggles pause
    Then the game should be paused
    When the player toggles pause
    Then the game should not be paused

  Scenario: Cannot move left when paused
    Given the game is paused
    When the player moves left
    Then the piece position should not change

  Scenario: Cannot move right when paused
    Given the game is paused
    When the player moves right
    Then the piece position should not change

  Scenario: Cannot rotate when paused
    Given the game is paused
    When the player rotates the piece
    Then the rotation state should not change

  Scenario: Cannot soft drop when paused
    Given the game is paused
    When the player soft drops
    Then the piece y position should not change

  Scenario: Cannot hard drop when paused
    Given the game is paused
    When the player hard drops
    Then the piece should not move

  Scenario: Gravity is paused when paused
    Given the game is paused
    When time passes
    Then the piece should not fall
    And gravity timer should not advance

  Scenario: Resume allows movement
    Given the game is paused
    When the player toggles pause to resume
    And the player moves left
    Then the piece position should change

  Scenario: Resume allows rotation
    Given the game is paused
    When the player toggles pause to resume
    And the player rotates the piece
    Then the rotation state should change

  Scenario: Resume allows drops
    Given the game is paused
    When the player toggles pause to resume
    And the player soft drops
    Then the piece y position should change

  Scenario: Resume allows gravity
    Given the game is paused
    When the player toggles pause to resume
    And time passes
    Then the piece should fall due to gravity

  Scenario: Game state preserved when paused
    Given the player has played for a while
    And has accumulated some score
    When the game is paused
    Then the score should remain unchanged
    And the board state should remain unchanged
    And the piece position should remain unchanged
