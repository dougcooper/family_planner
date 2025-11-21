# Test Execution Report: [FEATURE NAME]

**Feature**: [Feature name from spec.md]  
**Date**: [Date of test execution]  
**Executed By**: [Agent/Developer name]  
**Branch**: [###-feature-name]

---

## Executive Summary

**Overall Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL  
**Total Tests**: [X passed / Y total]  
**Pass Rate**: [X%]  
**Execution Time**: [Duration]

---

## Test Execution Details

### Test Command(s)

```bash
# Commands used to execute tests
npm test
# or
pytest
# or
cargo test
```

### Test Output Summary

```
[Paste relevant test output here]
Example:
================================ test session starts ================================
platform linux -- Python 3.11.0, pytest-7.4.0
collected 42 items

tests/unit/test_models.py ......................... [100%]
tests/integration/test_api.py ................. [100%]

================================ 42 passed in 2.34s =================================
```

---

## Test Breakdown by Category

### Unit Tests

**Status**: ✅ PASS / ❌ FAIL  
**Count**: [X passed / Y total]  
**Location**: `tests/unit/`

| Test File | Status | Tests | Notes |
|-----------|--------|-------|-------|
| test_models.py | ✅ | 12/12 | All model tests passing |
| test_services.py | ✅ | 8/8 | Service layer tests passing |

### Integration Tests

**Status**: ✅ PASS / ❌ FAIL  
**Count**: [X passed / Y total]  
**Location**: `tests/integration/`

| Test File | Status | Tests | Notes |
|-----------|--------|-------|-------|
| test_api.py | ✅ | 15/15 | All API endpoint tests passing |
| test_workflows.py | ✅ | 7/7 | User journey tests passing |

### Contract Tests

**Status**: ✅ PASS / ❌ FAIL  
**Count**: [X passed / Y total]  
**Location**: `tests/contract/`

| Test File | Status | Tests | Notes |
|-----------|--------|-------|-------|
| test_contracts.py | ✅ | 5/5 | API contract tests passing |

---

## Coverage Report (if applicable)

```
[Paste coverage report here]
Example:
Name                      Stmts   Miss  Cover
---------------------------------------------
src/models/__init__.py       10      0   100%
src/services/auth.py        45      2    96%
src/api/routes.py           82      5    94%
---------------------------------------------
TOTAL                       137      7    95%
```

**Coverage Target**: [e.g., 80%, 90%]  
**Actual Coverage**: [X%]  
**Status**: ✅ Met / ❌ Below target

---

## Failed Tests (if any)

### Test: [Test Name]

**Location**: `[path/to/test/file.py]`  
**Error Message**:
```
[Paste error message]
```

**Root Cause**: [Brief description]  
**Action Taken**: [What was done to fix it]  
**Status**: ✅ Fixed / ⚠️ In Progress / ❌ Known Issue

---

## Regression Check

**Question**: Did any existing tests break due to the changes?

**Answer**: ✅ No / ❌ Yes

**Details**:
- [List any tests that were broken and how they were fixed]
- [Or confirm no regressions detected]

---

## User Story Test Results

### User Story 1: [Title]

**Status**: ✅ PASS / ❌ FAIL  
**Tests**: [X/Y passed]  
**Independent Validation**: ✅ Passed / ❌ Failed

### User Story 2: [Title]

**Status**: ✅ PASS / ❌ FAIL  
**Tests**: [X/Y passed]  
**Independent Validation**: ✅ Passed / ❌ Failed

### User Story 3: [Title]

**Status**: ✅ PASS / ❌ FAIL  
**Tests**: [X/Y passed]  
**Independent Validation**: ✅ Passed / ❌ Failed

---

## Constitution Compliance

**Principle II - Comprehensive Testing Strategy**

- [x] All implemented tests executed
- [x] 100% pass rate achieved for CI/CD
- [x] Mock external dependencies properly
- [x] Tests are isolated and fast
- [x] No existing tests broken by changes

---

## Issues and Blockers

### Open Issues

1. [Issue description if any]
   - **Impact**: [High/Medium/Low]
   - **Plan**: [How will it be addressed]

### Resolved Issues

1. [Previously blocking issue]
   - **Resolution**: [How it was fixed]

---

## Recommendations

1. [Any recommendations for future testing]
2. [Suggestions for test improvements]
3. [Performance considerations]

---

## Sign-off

**Feature Ready for Deployment**: ✅ YES / ❌ NO

**Rationale**:
[Brief explanation of why the feature is/isn't ready]

**Next Steps**:
1. [What comes next]
2. [Any follow-up actions needed]

---

## Appendix

### Environment Details

- **OS**: [e.g., Ubuntu 22.04, macOS 13.0]
- **Language/Runtime**: [e.g., Python 3.11, Node.js 20.0]
- **Key Dependencies**: [List major dependencies and versions]
- **Test Framework**: [e.g., pytest 7.4.0, Jest 29.0]

### Additional Notes

[Any additional context, observations, or information relevant to the test execution]
