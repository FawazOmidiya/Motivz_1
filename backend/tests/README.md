# 🧪 Tests for Recurring Events System

This folder contains all the test files for the recurring events system.

## 📁 Test Files

- **`test_recurring_events.py`** - Basic recurring events functionality tests
- **`test_smart_recurring_events.py`** - Smart generation system tests
- **`run_all_tests.py`** - Test runner that executes all tests

## 🚀 How to Run Tests

### Run All Tests

```bash
cd backend
python tests/run_all_tests.py
```

### Run Individual Tests

```bash
# Basic recurring events tests
python tests/test_recurring_events.py

# Smart generation tests
python tests/test_smart_recurring_events.py
```

### Run Tests from Root Directory

```bash
# From the backend directory
python -m tests.run_all_tests

# Individual tests
python -m tests.test_recurring_events
python -m tests.test_smart_recurring_events
```

## 🧪 What Each Test Covers

### `test_recurring_events.py`

- ✅ Creating weekly recurring events
- ✅ Creating monthly recurring events
- ✅ Creating inactive recurring events
- ✅ Basic event generation

### `test_smart_recurring_events.py`

- ✅ Creating smart recurring events
- ✅ First run of smart generation
- ✅ Second run (duplicate prevention)
- ✅ Extended weeks generation

## 🔧 Test Environment

Tests automatically:

- Set up Django environment
- Connect to your Supabase database
- Use existing clubs for testing
- Create test events with "TEST" in titles
- Provide cleanup instructions

## 🧹 Cleanup

After running tests, clean up test data:

```sql
-- Remove all test events
DELETE FROM events WHERE title LIKE '%TEST%';

-- Verify cleanup
SELECT COUNT(*) FROM events WHERE title LIKE '%TEST%';
```

## 📝 Adding New Tests

1. Create new test file: `test_your_feature.py`
2. Follow the naming convention: `test_*.py`
3. Include a `main()` function
4. Add to this README
5. Test will be automatically picked up by `run_all_tests.py`

## 🚨 Troubleshooting

### Import Errors

- Ensure you're running from the `backend` directory
- Check that Django is properly set up
- Verify Supabase credentials are configured

### Database Issues

- Ensure your database is accessible
- Check that the `events` table exists
- Verify you have at least one club in the database

### Test Failures

- Check the error messages for specific issues
- Verify the recurring events system is working
- Run individual tests to isolate problems

## 🎯 Best Practices

1. **Always run tests** before deploying changes
2. **Use descriptive test names** that explain what's being tested
3. **Clean up test data** after testing
4. **Test both success and failure cases**
5. **Keep tests independent** - each test should be able to run alone

---

**🧪 Happy testing! Your recurring events system is only as good as your tests.**
