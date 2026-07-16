Feature: Space Invaders Pause, Game Over and Reset
  As a Space Invaders player
  I want the game to freeze completely when paused or over, and reset cleanly
  So that I can take a break or start again without stale state leaking through

  Background:
    Given a new Space Invaders game has started

  Scenario: Toggling pause flips the paused state
    When the invaders player toggles pause
    Then the invaders game should be paused
    When the invaders player toggles pause
    Then the invaders game should not be paused

  Scenario: A full update does nothing while paused
    Given the invaders game is paused
    And the invaders player is moving right
    When 100ms of Space Invaders time passes
    Then the invaders player x should not change

  Scenario: A full update does nothing after game over
    Given the invaders game is over
    And the invaders player is moving right
    When 100ms of Space Invaders time passes
    Then the invaders player x should not change

  Scenario: A full update proceeds normally when neither paused nor over
    Given the invaders player is moving right
    When 100ms of Space Invaders time passes
    Then the invaders player x should increase by 18

  Scenario: Reset restores the initial wave, score, lives and game-over state
    Given the invaders score is 500
    And the invaders lives is 1
    And the invaders wave is 3
    And the invaders game is over
    When the invaders game is reset
    Then the invaders score should be 0
    And the invaders lives should be 3
    And the invaders wave should be 1
    And the invaders game should not be over
    And the invaders game should not be paused

  Scenario: Reset rebuilds a fresh, fully alive formation
    Given every invader is dead
    When the invaders game is reset
    Then every invader should be alive again

  Scenario: Reset restores the player to the starting position and clears movement and bullets
    Given the invaders player is at x 10
    And the invaders player is moving left
    And the invaders player has already fired
    And an invader bullet is positioned exactly on the player
    When the invaders game is reset
    Then the invaders player x should be at the starting position
    And the invaders player should not be moving
    And no player bullet should exist
    And there should be no invader bullets in flight

  Scenario: Reset clears formation drift and the last event
    Given the formation offset x is 26
    And the formation direction is -1
    And the invaders player has already fired
    And an invader bullet is positioned exactly on the player
    And invader bullet collisions are processed
    When the invaders game is reset
    Then the formation offset x should be 0
    And the formation offset y should be 0
    And the formation direction should be 1
    And the last invaders event should be null
