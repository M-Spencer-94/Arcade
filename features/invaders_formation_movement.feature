Feature: Space Invaders Formation Movement
  As a Space Invaders player
  I want the invader formation to march side to side, drop, and speed up
  So that the classic escalating difficulty comes through

  Background:
    Given a new Space Invaders game has started

  Scenario: The step interval at full health and wave 1
    Then the formation step interval should be 800ms

  Scenario: The step interval scales down with alive ratio
    Given exactly 10 invaders are alive
    Then the formation step interval should be 200ms

  Scenario: The step interval is floored at its minimum as invaders thin out
    Given exactly 2 invaders are alive
    Then the formation step interval should be 80ms

  Scenario: The step interval boundary just above its minimum
    Given exactly 5 invaders are alive
    Then the formation step interval should be 100ms

  Scenario: The step interval speeds up with wave, just above the wave floor
    Given the invaders wave is 7
    Then the formation step interval should be 320ms

  Scenario: The step interval's wave component is floored at wave 8
    Given the invaders wave is 8
    Then the formation step interval should be 300ms

  Scenario: The step interval combines wave speedup and thinning invaders
    Given the invaders wave is 3
    And exactly 13 invaders are alive
    Then the formation step interval should be 208ms

  Scenario: Formation bounds consider only alive invaders
    Given every invader in column 0 is dead
    And every invader in column 7 is dead
    Then the formation bounds should span from column 1 to column 6

  Scenario: A normal formation step moves horizontally without changing direction
    When 800ms passes for the formation
    Then the formation offset x should increase by 8
    And the formation direction should not change
    And the formation offset y should not change

  Scenario: The step timer accumulates without stepping until the interval is reached
    When 799ms passes for the formation
    Then the formation offset x should not change
    When 1ms passes for the formation
    Then the formation offset x should increase by 8

  Scenario: Reaching the right edge reverses direction and drops instead of stepping horizontally
    Given the formation offset x is 26
    When 800ms passes for the formation
    Then the formation direction should be -1
    And the formation offset y should increase by 16
    And the formation offset x should not change

  Scenario: Just short of the right edge still steps normally
    Given the formation offset x is 25
    When 800ms passes for the formation
    Then the formation direction should not change
    And the formation offset x should increase by 8

  Scenario: Reaching the left edge reverses direction and drops instead of stepping horizontally
    Given the formation direction is -1
    And the formation offset x is -26
    When 800ms passes for the formation
    Then the formation direction should be 1
    And the formation offset y should increase by 16
    And the formation offset x should not change

  Scenario: Just short of the left edge still steps normally while moving left
    Given the formation direction is -1
    And the formation offset x is -25
    When 800ms passes for the formation
    Then the formation direction should not change
    And the formation offset x should decrease by 8

  Scenario: An empty formation advances to the next wave instead of stepping
    Given every invader is dead
    When 800ms passes for the formation
    Then the invaders wave should increase by 1
