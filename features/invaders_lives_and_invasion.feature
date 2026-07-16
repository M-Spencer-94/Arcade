Feature: Space Invaders Lives and Invasion
  As a Space Invaders player
  I want to lose a life (and recover) when hit, and lose the game outright if the invaders reach me
  So that the stakes of both threats are clear

  Background:
    Given a new Space Invaders game has started

  Scenario: Losing a life with lives remaining resets the player and clears bullets
    Given the invaders player is at x 50
    And the invaders player has already fired
    And an invader bullet is positioned exactly on the player
    When the invaders player loses a life
    Then the invaders lives should decrease by 1
    And the invaders game should not be over
    And no player bullet should exist
    And there should be no invader bullets in flight
    And the invaders player x should be at the starting position
    And the last invaders event should be "playerHit"

  Scenario: Losing the last life ends the game without resetting position or bullets
    Given the invaders lives is 1
    And the invaders player is at x 50
    And the invaders player has already fired
    When the invaders player loses a life
    Then the invaders lives should be 0
    And the invaders game should be over
    And a player bullet should exist
    And the invaders player x should be 50
    And the last invaders event should be "playerHit"

  Scenario: The formation reaching the player's row ends the game
    Given the formation is positioned so its lowest invader exactly reaches the player row
    When the invasion check runs
    Then the invaders game should be over

  Scenario: The formation just short of the player's row does not end the game
    Given the formation is positioned 1px short of reaching the player row
    When the invasion check runs
    Then the invaders game should not be over

  Scenario: The invasion check skips dead invaders but still detects the invasion via a survivor
    Given the formation is positioned so its lowest invader exactly reaches the player row
    And the row 4 column 0 invader is dead
    When the invasion check runs
    Then the invaders game should be over

  Scenario: The invasion check does nothing once the game is already over
    Given the invaders game is over
    When the invasion check runs
    Then the invaders game should be over
