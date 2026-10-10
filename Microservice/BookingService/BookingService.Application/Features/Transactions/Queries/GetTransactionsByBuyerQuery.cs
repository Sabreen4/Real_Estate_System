using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using MediatR;

namespace BookingService.Application.Features.Transactions.Queries
{
    // ── Query ────────────────────────────────────────────────────────────────
    public record GetTransactionsByBuyerQuery(int BuyerId, string Token)
        : IRequest<List<TransactionDto>>;

    // ── Handler ──────────────────────────────────────────────────────────────
    public class GetTransactionsByBuyerQueryHandler
        : IRequestHandler<GetTransactionsByBuyerQuery, List<TransactionDto>>
    {
        private readonly ITransactionRepository _repo;

        public GetTransactionsByBuyerQueryHandler(ITransactionRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<TransactionDto>> Handle(
            GetTransactionsByBuyerQuery request,
            CancellationToken cancellationToken)
        {
            return await _repo.GetByBuyerIdAsync(request.BuyerId, request.Token);
        }
    }
}