using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PropertyService.Application.DTOs;
using PropertyService.Application.Features.Properties.Command;
using PropertyService.Application.Features.Properties.Query;

namespace PropertyService.Api.Controllers
{
    [ApiController]
    [Route("api/properties")]
    [Authorize]
    public class PropertiesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IUserContextService _userContext;

        public PropertiesController(IMediator mediator, IUserContextService userContext)
        {
            _mediator = mediator;
            _userContext = userContext;
        }

        /// <summary>
        /// Get all properties — public, no userId filter.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(
            [FromQuery] PropertyFilterDto filter,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            //[FromQuery] int? userId = null, 
            CancellationToken cancellationToken = default
        )
        {
            var result = await _mediator.Send(
                new GetPropertiesQuery(filter, pageNumber, pageSize), // UserId defaults to null
                cancellationToken
            );

            return Ok(result);
        }

        /// <summary>
        /// Get only the authenticated agent's own properties.
        /// AGENT or ADMIN only.
        /// </summary>
        [HttpGet("my")]
        [Authorize(Roles = "AGENT,ADMIN")]
        public async Task<IActionResult> GetMyProperties(
            [FromQuery] PropertyFilterDto filter,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken cancellationToken = default
        )
        {
            var userId = _userContext.GetUserId();

            var result = await _mediator.Send(
                new GetPropertiesQuery(filter, pageNumber, pageSize, userId),
                cancellationToken
            );

            return Ok(result);
        }

        /// <summary>
        /// Get property by ID — public.
        /// </summary>
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetPropertyByIdQuery(id), cancellationToken);

            return result is null
                ? NotFound(new { message = $"Property with id {id} not found." })
                : Ok(result);
        }

        [HttpPut("{id}/mark-sold")]
        [Authorize]
        public async Task<IActionResult> MarkAsSold(int id)
        {
            await _mediator.Send(new MarkPropertyAsSoldCommand(id));
            return Ok();
        }

        /// <summary>
        /// Create property — AGENT or ADMIN only.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "AGENT,ADMIN")]
        public async Task<IActionResult> Create(
            [FromBody] CreatePropertyRequestDto dto,
            CancellationToken cancellationToken
        )
        {
            var userId = _userContext.GetUserId();

            var result = await _mediator.Send(
                new CreatePropertyCommand(userId, dto),
                cancellationToken
            );

            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        /// <summary>
        /// Update property — AGENT or ADMIN only.
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Roles = "AGENT,ADMIN")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(
            int id,
            [FromForm] UpdatePropertyRequestDto request,
            CancellationToken cancellationToken
        )
        {
            if (id != request.Id)
                return BadRequest(new { message = "Route id and body id do not match." });

            var userId = _userContext.GetUserId();
            var isAdmin = User.IsInRole("ADMIN");

            try
            {
                var result = await _mediator.Send(
                    new UpdatePropertyCommand(userId, isAdmin, request),
                    cancellationToken
                );

                return result is null
                    ? NotFound(new { message = $"Property with id {id} not found." })
                    : Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Delete property — AGENT or ADMIN only.
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "AGENT,ADMIN")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var userId = _userContext.GetUserId();
            var isAdmin = User.IsInRole("ADMIN");

            try
            {
                var success = await _mediator.Send(
                    new DeletePropertyCommand(id, userId, isAdmin),
                    cancellationToken
                );

                return success
                    ? Ok(new { message = "Property deleted successfully." })
                    : NotFound(new { message = $"Property with id {id} not found." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
        }
    }
}
