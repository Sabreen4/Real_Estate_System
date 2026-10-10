using System.Security.Claims;
using BookingService.Application.DTOs;
using BookingService.Application.Features.Transactions.Commands;
using BookingService.Application.Features.Transactions.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingService.Api.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<TransactionsController> _logger;

        public TransactionsController(IMediator mediator, ILogger<TransactionsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// Create Transaction
        [Authorize(Roles = "BUYER")]
        [HttpPost("transactions")]
        public async Task<IActionResult> Create([FromBody] CreateTransactionRequest request)
        {
            var buyerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            _logger.LogInformation(
                "Create transaction request received. BuyerId: {BuyerId}, PropertyId: {PropertyId}, SellerId: {SellerId}, Amount: {Amount}",
                buyerId,
                request.PropertyId,
                request.SellerId,
                request.Amount
            );

            var result = await _mediator.Send(
                new CreateTransactionCommand(
                    request.PropertyId,
                    buyerId,
                    request.SellerId,
                    request.Amount
                )
            );

            _logger.LogInformation(
                "Transaction created successfully. BuyerId: {BuyerId}, PropertyId: {PropertyId}",
                buyerId,
                request.PropertyId
            );

            return Ok(result);
        }

        /// Get Transaction by Id
        [HttpGet("transactions/{id}")]
        public async Task<IActionResult> Get(int id)
        {
            _logger.LogInformation(
                "Get transaction request received. TransactionId: {TransactionId}",
                id
            );

            var result = await _mediator.Send(new GetTransactionByIdQuery(id));

            _logger.LogInformation(
                "Transaction retrieved successfully. TransactionId: {TransactionId}",
                id
            );

            return Ok(result);
        }

        /// Get Transactions for Logged-in Buyer
        /// Get Transactions for Logged-in Buyer
        [Authorize(Roles = "BUYER")]
        [HttpGet("transactions/my")]
        public async Task<IActionResult> GetMyTransactions()
        {
            var buyerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            // grab the Bearer token from the incoming request
            var token = HttpContext.Request.Headers["Authorization"].ToString();

            _logger.LogInformation(
                "Get my transactions request received. BuyerId: {BuyerId}",
                buyerId
            );

            var result = await _mediator.Send(
                new GetTransactionsByBuyerQuery(buyerId, token) // ← pass token
            );

            _logger.LogInformation(
                "Transactions retrieved. BuyerId: {BuyerId}, Count: {Count}",
                buyerId,
                result.Count
            );

            return Ok(result);
        }

        /// Get Transactions by Property
        [Authorize(Roles = "AGENT,ADMIN")]
        [HttpGet("properties/{propertyId}/transactions")]
        public async Task<IActionResult> GetByProperty(int propertyId)
        {
            _logger.LogInformation(
                "Get transactions by property request received. PropertyId: {PropertyId}",
                propertyId
            );

            var result = await _mediator.Send(new GetTransactionsByPropertyQuery(propertyId));

            _logger.LogInformation(
                "Transactions retrieved successfully. PropertyId: {PropertyId}",
                propertyId
            );

            return Ok(result);
        }

        /// Update Transaction Status
        [Authorize]
        [HttpPut("transactions/{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] UpdateStatusRequest request
        )
        {
            var token = HttpContext.Request.Headers["Authorization"].ToString();

            _logger.LogInformation(
                "Update transaction status request received. TransactionId: {TransactionId}, Status: {Status}",
                id,
                request.Status
            );

            await _mediator.Send(new UpdateTransactionStatusCommand(id, request.Status, token));

            _logger.LogInformation(
                "Transaction status updated successfully. TransactionId: {TransactionId}",
                id
            );

            return Ok();
        }

        /// Get Transactions for Logged-in Agent (across their properties)
        [Authorize(Roles = "AGENT")]
        [HttpGet("transactions/agent")]
        public async Task<IActionResult> GetAgentTransactions()
        {
            var agentId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var token = HttpContext.Request.Headers["Authorization"].ToString();

            _logger.LogInformation(
                "Get agent transactions request received. AgentId: {AgentId}",
                agentId
            );

            var result = await _mediator.Send(new GetTransactionsByAgentQuery(agentId, token));

            return Ok(result);
        }
    }
}
