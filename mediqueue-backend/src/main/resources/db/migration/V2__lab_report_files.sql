-- Lab report files are stored in the database (hosted servers without a persistent disk lose
-- files written to their filesystem). One row per report, loaded only when it is downloaded.
CREATE TABLE lab_report_files (
    report_id  BIGINT PRIMARY KEY,
    data       LONGBLOB NOT NULL,
    CONSTRAINT fk_lrf_report FOREIGN KEY (report_id)
        REFERENCES lab_reports(report_id) ON DELETE CASCADE
);
