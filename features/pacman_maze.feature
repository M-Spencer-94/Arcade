Feature: Maze Boundaries
  As the Pac-Man game engine
  I want the maze to safely handle out-of-range positions
  So that entities can never read outside the grid

  Background:
    Given a fresh maze

  Scenario: wrapCol wraps a negative column to the rightmost column
    Then wrapping column -1 should give column 14

  Scenario: wrapCol wraps a column past the last one back to zero
    Then wrapping column 15 should give column 0

  Scenario: wrapCol leaves an in-range column unchanged
    Then wrapping column 7 should give column 7

  Scenario: A row above the maze is always treated as a wall
    Then row -1 at column 7 should be a wall

  Scenario: A row below the maze is always treated as a wall
    Then row 15 at column 7 should be a wall

  Scenario: An in-range wall cell is reported as a wall
    Then row 0 at column 0 should be a wall

  Scenario: An in-range open cell is not reported as a wall
    Then row 7 at column 7 should not be a wall
