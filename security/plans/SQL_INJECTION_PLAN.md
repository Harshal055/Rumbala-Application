# SQL_INJECTION Fix Plan

## Changes

- None required. All queries use parameterized query builder or static SQL procedures.

## Verification goals

- [x] Zero raw string query concatenation in client codebase
- [x] Zero dynamic SQL (`EXECUTE format(...)`) in database functions
- [x] All query parameters are strictly typed

## Manual verification (for the human)

- None needed.
