using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PropertyService.Application.DTOs;
using PropertyService.Application.Features.Offers.Command;
using PropertyService.Application.Features.Offers.Query;

namespace PropertyService.Api.Controllers
{
    /// <summary>
    /// Controller to manage property offers.
    /// </summary>
    [ApiController]
    [Route("api")]
    [Authorize]
    public class OffersController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IUserContextService _userContext;

        public OffersController(IMediator mediator, IUserContextService userContext)
        {
            _mediator = mediator;
            _userContext = userContext;
        }

        /// <summary>
        /// Creates a new offer for a property.
        /// Only accessible by BUYER.
        /// </summary>
        [Authorize(Roles = "BUYER")]
        [HttpPost("properties/{propertyId}/offers")]
        public async Task<IActionResult> Create(
            int propertyId,
            [FromBody] CreateOfferRequest request,
            CancellationToken cancellationToken
        )
        {
            var userId = _userContext.GetUserId();
            Console.WriteLine($"USER ID FROM TOKEN: {userId}");

            var result = await _mediator.Send(
                new CreateOfferCommand(propertyId, userId, request.OfferAmount),
                cancellationToken
            );

            return Ok(result);
        }

        /// <summary>
        /// Gets all offers on the logged-in agent's properties.
        /// Only accessible by AGENT.
        /// </summary>
        [Authorize(Roles = "AGENT")]
        [HttpGet("offers")]
        public async Task<IActionResult> GetAgentOffers(CancellationToken cancellationToken)
        {
            var agentId = _userContext.GetUserId();

            var result = await _mediator.Send(new GetAgentOffersQuery(agentId), cancellationToken);

            return Ok(result);
        }

        [Authorize(Roles = "BUYER")]
        [HttpGet("offers/my")]
        public async Task<IActionResult> GetBuyerOffers(CancellationToken cancellationToken)
        {
            var buyerId = _userContext.GetUserId();

            var result = await _mediator.Send(new GetBuyerOffersQuery(buyerId), cancellationToken);

            return Ok(result);
        }

        /// <summary>
        /// Updates offer status.
        /// Only accessible by AGENT.
        /// </summary>
        [Authorize(Roles = "AGENT")]
        [HttpPut("offers/{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] UpdateOfferStatusRequestDto request,
            CancellationToken cancellationToken
        )
        {
            await _mediator.Send(
                new UpdateOfferStatusCommand(id, request.Status),
                cancellationToken
            );

            return Ok();
        }
    }
}
