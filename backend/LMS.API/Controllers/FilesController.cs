using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace LMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    public FilesController(IWebHostEnvironment env, IConfiguration config) { _env = env; _config = config; }

    private static readonly string[] AllowedExtensions = { ".pdf" };
    private const long MaxFileSizeBytes = 15 * 1024 * 1024; // 15 MB

    [HttpPost("upload-pdf")]
    public async Task<IActionResult> UploadPdf(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { message = "File too large. Maximum size is 15 MB." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = "Only PDF files are allowed" });

        var uploadsPath = Path.Combine(_env.ContentRootPath, "Uploads");
        Directory.CreateDirectory(uploadsPath);

        var safeFileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadsPath, safeFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Build an absolute URL the frontend can open directly
        var request = HttpContext.Request;
        var baseUrl = $"{request.Scheme}://{request.Host}";
        var fileUrl = $"{baseUrl}/uploads/{safeFileName}";

        return Ok(new { fileUrl, originalName = file.FileName, sizeBytes = file.Length });
    }
}
