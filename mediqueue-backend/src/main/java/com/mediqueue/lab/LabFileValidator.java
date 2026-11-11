package com.mediqueue.lab;

import com.mediqueue.exception.BadRequestException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;

/**
 * Checks an uploaded lab report: PDF, PNG or JPEG only, at most 10 MB, with an extension that
 * matches the file's real content (its first bytes), so a renamed .exe cannot pass as a .pdf. Also
 * cleans the original file name for storing and for the download header.
 */
public final class LabFileValidator {

    public static final long MAX_BYTES = 10L * 1024 * 1024;

    /** What the file really is, worked out from its content. */
    public record AcceptedFile(String extension, String contentType) {}

    private static final Map<String, String> CONTENT_TYPES =
            Map.of(
                    "pdf", "application/pdf",
                    "png", "image/png",
                    "jpg", "image/jpeg",
                    "jpeg", "image/jpeg");

    private LabFileValidator() {}

    /**
     * @param originalName the name the browser sent
     * @param size file size in bytes
     * @param head the first bytes of the file (at least 8 if the file is that long)
     */
    public static AcceptedFile validate(String originalName, long size, byte[] head) {
        if (size <= 0) throw new BadRequestException("The file is empty");
        if (size > MAX_BYTES)
            throw new BadRequestException("The file is too large (maximum 10 MB)");

        String ext = extensionOf(originalName);
        if (!CONTENT_TYPES.containsKey(ext)) {
            throw new BadRequestException("Only PDF, PNG and JPEG files can be uploaded");
        }
        String detected = detect(head);
        if (detected == null || !detected.equals(CONTENT_TYPES.get(ext))) {
            throw new BadRequestException(
                    "The file's content does not match its ."
                            + ext
                            + " extension. Upload a real PDF, PNG or JPEG file.");
        }
        return new AcceptedFile(ext.equals("jpeg") ? "jpg" : ext, detected);
    }

    /** Recognises PDF, PNG and JPEG by their signature bytes; null for anything else. */
    static String detect(byte[] h) {
        if (h == null) return null;
        if (startsWith(h, '%', 'P', 'D', 'F', '-')) return "application/pdf";
        if (startsWith(h, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) return "image/png";
        if (startsWith(h, 0xFF, 0xD8, 0xFF)) return "image/jpeg";
        return null;
    }

    /** Keeps only the last path segment and safe characters; never used as a path on disk. */
    public static String cleanFileName(String original) {
        String name = original == null ? "" : original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[^A-Za-z0-9._ -]", "_").trim();
        if (name.isBlank() || name.chars().allMatch(c -> c == '.')) name = "report";
        return name.length() > 120 ? name.substring(name.length() - 120) : name;
    }

    static String extensionOf(String name) {
        if (name == null) return "";
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).trim().toLowerCase(Locale.ROOT);
    }

    private static boolean startsWith(byte[] h, int... sig) {
        if (h.length < sig.length) return false;
        return Arrays.equals(Arrays.copyOf(h, sig.length), toBytes(sig));
    }

    private static byte[] toBytes(int[] v) {
        byte[] b = new byte[v.length];
        for (int i = 0; i < v.length; i++) b[i] = (byte) v[i];
        return b;
    }
}
