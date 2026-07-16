Feature: Leaderboard API
  As a player
  I want each game's leaderboard to persist scores to disk
  So that high scores survive a server restart

  Background:
    Given a fresh leaderboard server

  Scenario: Empty leaderboard for a new game
    When I request the leaderboard for "tetris"
    Then the response status should be 200
    And the leaderboard should have 0 entries

  Scenario: Requesting an unknown game returns 404
    When I request the leaderboard for "asteroids"
    Then the response status should be 404

  Scenario: Submitting a valid score is accepted and ranked
    When I submit a score of 5000 for "AAA" to "tetris"
    Then the response status should be 201
    And the response rank should be 1
    And the leaderboard for "tetris" should have 1 entries

  Scenario: Scores are sorted highest first
    Given a score of 1000 for "LOW" has been submitted to "tetris"
    And a score of 9000 for "HIGH" has been submitted to "tetris"
    When I request the leaderboard for "tetris"
    Then entry 1 should be "HIGH" with score 9000
    And entry 2 should be "LOW" with score 1000

  Scenario: Submitting to an unknown game returns 404
    When I submit a score of 100 for "AAA" to "asteroids"
    Then the response status should be 404

  Scenario: Submitting an empty name is rejected
    When I submit a score of 100 for "" to "tetris"
    Then the response status should be 400

  Scenario: Submitting a name over 12 characters is rejected
    When I submit a score of 100 for "WAYTOOLONGNAME" to "tetris"
    Then the response status should be 400

  Scenario: Submitting a negative score is rejected
    When I submit a score of -50 for "AAA" to "tetris"
    Then the response status should be 400

  Scenario: Submitting a non-integer score is rejected
    When I submit a score of 12.5 for "AAA" to "tetris"
    Then the response status should be 400

  Scenario: Only the top 10 scores are kept
    Given 11 distinct scores have been submitted to "tetris"
    When I request the leaderboard for "tetris"
    Then the leaderboard for "tetris" should have 10 entries

  Scenario: An 11th-place score is not ranked
    Given 10 distinct scores from 100 to 1000 have been submitted to "tetris"
    When I submit a score of 50 for "ZZZ" to "tetris"
    Then the response rank should be null

  Scenario: Leaderboard data survives a simulated server restart
    Given a score of 7500 for "SURVIVOR" has been submitted to "pacman"
    When the leaderboard server restarts
    And I request the leaderboard for "pacman"
    Then entry 1 should be "SURVIVOR" with score 7500

  Scenario: A corrupted leaderboard file recovers to an empty board
    Given the "space-invaders" leaderboard file is corrupted
    When I request the leaderboard for "space-invaders"
    Then the response status should be 200
    And the leaderboard should have 0 entries

  Scenario: A leaderboard file with valid JSON but no entries array recovers to an empty board
    Given the "tetris" leaderboard file contains JSON without an entries array
    When I request the leaderboard for "tetris"
    Then the response status should be 200
    And the leaderboard should have 0 entries

  Scenario: A leaderboard file containing the JSON literal null recovers to an empty board
    Given the "tetris" leaderboard file contains the JSON literal null
    When I request the leaderboard for "tetris"
    Then the response status should be 200
    And the leaderboard should have 0 entries
