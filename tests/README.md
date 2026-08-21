# Kiểm thử

Thư mục này dùng cho tài liệu kiểm thử cấp dự án, test tích hợp toàn hệ thống và test end-to-end.

Quy ước hiện tại:

- `tests/e2e/`: Playwright end-to-end tests cho frontend và các luồng tích hợp qua UI.
- `tests/e2e/support/`: helper/mock dùng chung cho Playwright tests.
- `tests/artifacts/`: report, trace, screenshot và test-results local; thư mục này không commit lên Git.

Test backend JUnit vẫn đặt theo chuẩn Maven tại `src/backend/src/test` để `mvn test` tự nhận diện và chạy đúng lifecycle.
