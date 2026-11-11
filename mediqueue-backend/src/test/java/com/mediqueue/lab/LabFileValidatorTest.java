package com.mediqueue.lab;

import static org.junit.jupiter.api.Assertions.*;

import com.mediqueue.exception.BadRequestException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class LabFileValidatorTest {

    private static final byte[] PDF = "%PDF-1.7\n...".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0};
    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0};
    private static final byte[] EXE = {'M', 'Z', (byte) 0x90, 0, 3, 0};

    @Test
    void acceptsPdfPngAndJpeg() {
        assertEquals(
                "application/pdf", LabFileValidator.validate("cbc.pdf", 1000, PDF).contentType());
        assertEquals("image/png", LabFileValidator.validate("xray.PNG", 1000, PNG).contentType());
        var jpeg = LabFileValidator.validate("scan.jpeg", 1000, JPG);
        assertEquals("image/jpeg", jpeg.contentType());
        assertEquals("jpg", jpeg.extension());
    }

    @Test
    void rejectsOtherFileTypes() {
        var e =
                assertThrows(
                        BadRequestException.class,
                        () -> LabFileValidator.validate("notes.docx", 1000, PDF));
        assertTrue(e.getMessage().contains("PDF, PNG and JPEG"));
    }

    @Test
    void rejectsARenamedFileWhoseContentDoesNotMatch() {
        assertThrows(
                BadRequestException.class,
                () -> LabFileValidator.validate("report.pdf", 1000, EXE));
        assertThrows(
                BadRequestException.class, () -> LabFileValidator.validate("photo.png", 1000, JPG));
    }

    @Test
    void rejectsEmptyAndOversizedFiles() {
        assertThrows(BadRequestException.class, () -> LabFileValidator.validate("a.pdf", 0, PDF));
        var e =
                assertThrows(
                        BadRequestException.class,
                        () ->
                                LabFileValidator.validate(
                                        "a.pdf", LabFileValidator.MAX_BYTES + 1, PDF));
        assertTrue(e.getMessage().contains("10 MB"));
        assertDoesNotThrow(
                () -> LabFileValidator.validate("a.pdf", LabFileValidator.MAX_BYTES, PDF));
    }

    @Test
    void cleansFileNames() {
        assertEquals("passwd", LabFileValidator.cleanFileName("../../etc/passwd"));
        assertEquals("evil.pdf", LabFileValidator.cleanFileName("C:\\Users\\x\\evil.pdf"));
        assertEquals("blood_test_1_.pdf", LabFileValidator.cleanFileName("blood<test>1\".pdf"));
        assertEquals("report", LabFileValidator.cleanFileName(".."));
        assertEquals("report", LabFileValidator.cleanFileName(null));
    }
}
