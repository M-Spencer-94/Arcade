Feature: Space Invaders Invader Shooting
  As a Space Invaders player
  I want the invaders to fire back on a timer, from a live invader in a random column
  So that dodging enemy fire is part of the challenge

  Background:
    Given a new Space Invaders game has started

  Scenario: The shot interval at wave 1
    Then the invader shot interval should be 1200ms

  Scenario: The shot interval decreases with wave
    Given the invaders wave is 5
    Then the invader shot interval should be 800ms

  Scenario: The shot interval boundary just above its minimum
    Given the invaders wave is 8
    Then the invader shot interval should be 500ms

  Scenario: The shot interval boundary exactly at its minimum
    Given the invaders wave is 9
    Then the invader shot interval should be 400ms

  Scenario: The shot interval is floored at its minimum
    Given the invaders wave is 20
    Then the invader shot interval should be 400ms

  Scenario: Firing occurs once the shot interval elapses
    When 1200ms passes for invader shooting
    Then the number of invader bullets should increase by 1

  Scenario: No shot fires before the shot interval elapses
    When 1199ms passes for invader shooting
    Then the number of invader bullets should not change

  Scenario: The shot timer accumulates across ticks
    When 700ms passes for invader shooting
    And 500ms passes for invader shooting
    Then the number of invader bullets should increase by 1

  Scenario: No shot fires once the maximum number of invader bullets is in flight
    Given 3 invader bullets are already in flight
    When 1200ms passes for invader shooting
    Then the number of invader bullets should not change

  Scenario: No shot fires once every invader is dead
    Given every invader is dead
    When 1200ms passes for invader shooting
    Then the number of invader bullets should not change

  Scenario: A fired bullet originates from the alive invader with the highest row in its column
    When 1200ms passes for invader shooting
    Then the fired invader bullet should originate from the alive invader with the highest row in its column

  Scenario: Column selection still finds the true highest row even when construction order suggests otherwise
    Given every invader is dead except those in column 3
    And the invaders in column 3 at rows 3 and 4 have swapped row values
    When 1200ms passes for invader shooting
    Then the fired invader bullet should originate from the alive invader with the highest row in its column

  Scenario: A bullet only comes from a column that still has a surviving invader
    Given every invader is dead except those in column 5
    When 1200ms passes for invader shooting
    Then the fired invader bullet should originate from the alive invader with the highest row in its column
    And the fired invader bullet should originate from column 5

  Scenario: An invader bullet moves downward each tick
    Given an invader bullet is at y 100
    When 100ms passes for bullet movement
    Then the invader bullet y should be 115

  Scenario: An invader bullet just short of the bottom edge remains in flight
    Given an invader bullet is at y 379
    When 0ms passes for bullet movement
    Then that invader bullet should still be in flight

  Scenario: An invader bullet that reaches the bottom edge is removed
    Given an invader bullet is at y 380
    When 0ms passes for bullet movement
    Then that invader bullet should no longer be in flight
