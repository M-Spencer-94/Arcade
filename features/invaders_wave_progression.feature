Feature: Space Invaders Wave Progression
  As a Space Invaders player
  I want each new wave to rebuild the invaders and reset formation drift
  So that the game continues, while my score and lives carry over

  Background:
    Given a new Space Invaders game has started

  Scenario: Defeating every invader advances to the next wave
    Given every invader is dead
    When the wave advances
    Then the invaders wave should be 2
    And every invader should be alive again
    And the last invaders event should be "waveClear"

  Scenario: Advancing waves resets the formation position and direction
    Given the formation offset x is 26
    And the formation direction is -1
    When the wave advances
    Then the formation offset x should be 0
    And the formation offset y should be 0
    And the formation direction should be 1

  Scenario: Advancing waves clears both bullet states
    Given the invaders player has already fired
    And an invader bullet is positioned exactly on the player
    When the wave advances
    Then no player bullet should exist
    And there should be no invader bullets in flight

  Scenario: Advancing waves carries score and lives forward unchanged
    Given the invaders score is 500
    And the invaders lives is 2
    When the wave advances
    Then the invaders score should be 500
    And the invaders lives should be 2

  Scenario: An emptied formation triggers the next wave automatically during a normal update
    Given every invader is dead
    When 800ms passes for the formation
    Then the invaders wave should be 2
    And every invader should be alive again
