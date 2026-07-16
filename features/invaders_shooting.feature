Feature: Space Invaders Player Shooting
  As a Space Invaders player
  I want to fire a single bullet at a time that travels upward
  So that combat follows the classic single-shot arcade rule

  Background:
    Given a new Space Invaders game has started

  Scenario: Shooting spawns a player bullet at the top of the ship
    When the invaders player shoots
    Then a player bullet should exist
    And the player bullet should be at the top of the player

  Scenario: Cannot fire a second shot while one is active
    Given the invaders player has already fired
    When the invaders player shoots
    Then no additional player bullet should have been created

  Scenario: Can fire again once the previous bullet clears
    Given the invaders player has already fired
    And the player bullet is at y -11
    When 0ms passes for bullet movement
    And the invaders player shoots
    Then a player bullet should exist

  Scenario: Cannot shoot while paused
    Given the invaders game is paused
    When the invaders player shoots
    Then no player bullet should exist

  Scenario: Cannot shoot after game over
    Given the invaders game is over
    When the invaders player shoots
    Then no player bullet should exist

  Scenario: The player bullet moves upward each tick
    Given the invaders player has already fired
    When 100ms passes for bullet movement
    Then the player bullet y should be 310

  Scenario: The player bullet is removed once fully off the top of the screen
    Given the player bullet is at y -11
    When 0ms passes for bullet movement
    Then no player bullet should exist

  Scenario: The player bullet just short of fully off-screen remains active
    Given the player bullet is at y -10
    When 0ms passes for bullet movement
    Then a player bullet should exist

  Scenario: The player bullet travels upward and clears the screen naturally
    Given the invaders player has already fired
    When 1200ms passes for bullet movement
    Then no player bullet should exist

  Scenario: Processing player bullet collisions with no bullet in flight does nothing
    When player bullet collisions are processed
    Then no player bullet should exist
    And the invaders score should not change
