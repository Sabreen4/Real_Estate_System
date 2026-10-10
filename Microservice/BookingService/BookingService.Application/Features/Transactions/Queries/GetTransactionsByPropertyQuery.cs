using AutoMapper;
using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Transactions.Queries
{
    public record GetTransactionsByPropertyQuery(int PropertyId) : IRequest<List<TransactionDto>>;

    public class GetTransactionsByPropertyQueryHandler
        : IRequestHandler<GetTransactionsByPropertyQuery, List<TransactionDto>>
    {
        private readonly ITransactionRepository _repository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetTransactionsByPropertyQueryHandler> _logger;

        public GetTransactionsByPropertyQueryHandler(
            ITransactionRepository repository,
            IMapper mapper,
            ILogger<GetTransactionsByPropertyQueryHandler> logger
        )
        {
            _repository = repository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<TransactionDto>> Handle(
            GetTransactionsByPropertyQuery request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Handling GetTransactionsByPropertyQuery for PropertyId={PropertyId}",
                request.PropertyId
            );

            try
            {
                var transactions = await _repository.GetByPropertyIdAsync(request.PropertyId);
                var mapped = _mapper.Map<List<TransactionDto>>(transactions);

                _logger.LogInformation(
                    "Retrieved {Count} transactions for PropertyId={PropertyId}",
                    mapped.Count,
                    request.PropertyId
                );
                return mapped;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error while handling GetTransactionsByPropertyQuery for PropertyId={PropertyId}",
                    request.PropertyId
                );
                throw;
            }
        }
    }
}
