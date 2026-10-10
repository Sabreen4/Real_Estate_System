using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PropertyService.Application.Features.PropertyImages.Command;
using PropertyService.Application.Features.PropertyImages.Query;
using PropertyService.Application.Interfaces;

namespace PropertyService.Api.Controllers
{
    /// <summary>
    /// Controller to manage property image operations such as upload, delete, and retrieval.
    /// </summary>
    [Route("api/properties/{propertyId}/images")]
    [ApiController]
    public class PropertyImagesController : ControllerBase
    {
        private readonly IMediator _mediator;

        /// <summary>
        /// Constructor to inject IMediator dependency.
        /// </summary>
        /// <param name="mediator">Mediator instance for sending commands and queries.</param>
        public PropertyImagesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Uploads images for a specific property.
        /// Only accessible by users with "AGENT" or "ADMIN" roles.
        /// </summary>
        /// <param name="propertyId">The ID of the property for which images are uploaded.</param>
        /// <param name="files">List of image files to upload.</param>
        /// <param name="fileValidationService">Service to validate the uploaded files.</param>
        /// <returns>Returns the uploaded image information.</returns>
        /// <response code="200">Images uploaded successfully.</response>
        /// <response code="400">No files uploaded or validation failed.</response>
        [HttpPost]
        [Authorize(Roles = "AGENT,ADMIN")]
        public async Task<IActionResult> Upload(
            int propertyId,
            [FromForm] List<IFormFile> files,
            IFileValidationService fileValidationService
        )
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded.");

            var (isValid, errorMessage) = fileValidationService.ValidateFiles(files);
            if (!isValid)
                return BadRequest(errorMessage);

            var fileBytes = new List<byte[]>();
            var contentTypes = new List<string>();

            foreach (var file in files)
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                fileBytes.Add(ms.ToArray());
                contentTypes.Add(file.ContentType);
            }

            var result = await _mediator.Send(
                new UploadPropertyImagesCommand(propertyId, fileBytes, contentTypes)
            );

            return Ok(result);
        }

        /// <summary>
        /// Deletes one or more property images by their IDs.
        /// Only accessible by users with "AGENT" or "ADMIN" roles.
        /// </summary>
        /// <param name="ids">List of image IDs to delete.</param>
        /// <returns>No content if deletion is successful.</returns>
        [HttpDelete]
        [Authorize(Roles = "AGENT,ADMIN")]
        public async Task<IActionResult> Delete([FromBody] List<int> ids)
        {
            await _mediator.Send(new DeletePropertyImagesCommand(ids));
            return NoContent();
        }

        /// <summary>
        /// Retrieves all images associated with a specific property.
        /// </summary>
        /// <param name="propertyId">The ID of the property.</param>
        /// <returns>List of property images.</returns>
        [HttpGet]
        public async Task<IActionResult> Get(int propertyId)
        {
            var result = await _mediator.Send(new GetPropertyImagesQuery(propertyId));

            return Ok(result);
        }
    }
}
