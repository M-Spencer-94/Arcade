Feature: Space Invaders Player Movement
  As a Space Invaders player
  I want my ship to move left and right at a steady speed, clamped to the screen
  So that I can dodge invader fire without flying off the edge

  Background:
    Given a new Space Invaders game has started

  Scenario: Moving left decreases x according to the speed formula
    Given the invaders player is moving left
    When 100ms passes for the invaders player
    Then the invaders player x should decrease by 18

  Scenario: Moving left is clamped at the left edge
    Given the invaders player is moving left
    And the invaders player is at x 10
    When 1000ms passes for the invaders player
    Then the invaders player x should be 0

  Scenario: Moving left stops exactly at the left edge boundary
    Given the invaders player is moving left
    And the invaders player is at x 18
    When 100ms passes for the invaders player
    Then the invaders player x should be 0

  Scenario: Moving right increases x according to the speed formula
    Given the invaders player is moving right
    When 100ms passes for the invaders player
    Then the invaders player x should increase by 18

  Scenario: Moving right is clamped at the right edge
    Given the invaders player is moving right
    And the invaders player is at x 260
    When 1000ms passes for the invaders player
    Then the invaders player x should be 270

  Scenario: Moving right stops exactly at the right edge boundary
    Given the invaders player is moving right
    And the invaders player is at x 252
    When 100ms passes for the invaders player
    Then the invaders player x should be 270

  Scenario: The player does not move when no direction is set
    When 100ms passes for the invaders player
    Then the invaders player x should not change

  Scenario: Stopping movement halts further motion
    Given the invaders player is moving left
    When the invaders player stops moving
    And 100ms passes for the invaders player
    Then the invaders player x should not change
