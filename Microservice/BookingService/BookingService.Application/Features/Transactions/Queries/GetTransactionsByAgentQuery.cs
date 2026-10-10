// Application/Features/Transactions/Queries/GetTransactionsByAgentQuery.cs

using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Transactions.Queries
{
    // ── Query ──────────────────────────────────────────────────────────────
    public record GetTransactionsByAgentQuery(int AgentId, string Token)
        : IRequest<List<TransactionDto>>;

    // ── Handler ────────────────────────────────────────────────────────────
    public class GetTransactionsByAgentQueryHandler
        : IRequestHandler<GetTransactionsByAgentQuery, List<TransactionDto>>
    {
        private readonly ITransactionRepository _repo;
        private readonly ILogger<GetTransactionsByAgentQueryHandler> _logger;

        public GetTransactionsByAgentQueryHandler(
            ITransactionRepository repo,
            ILogger<GetTransactionsByAgentQueryHandler> logger
        )
        {
            _repo = repo;
            _logger = logger;
        }

        public async Task<List<TransactionDto>> Handle(
            GetTransactionsByAgentQuery request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation("Fetching transactions for AgentId: {AgentId}", request.AgentId);

            var transactions = await _repo.GetByAgentIdAsync(request.AgentId);

            return transactions
                .Select(t => new TransactionDto
                {
                    Id = t.Id,
                    PropertyId = t.PropertyId,
                    BuyerId = t.BuyerId,
                    SellerId = t.SellerId,
                    Amount = t.Amount,
                    Status = t.Status.Key,
                })
                .ToList();
        }
    }
}
