using AutoMapper;
using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Transactions.Queries
{
    public record GetTransactionByIdQuery(int Id) : IRequest<TransactionDto>;

    public class GetTransactionByIdQueryHandler
        : IRequestHandler<GetTransactionByIdQuery, TransactionDto>
    {
        private readonly ITransactionRepository _repository;
        private readonly IMapper _mapper;
        private readonly ILogger<GetTransactionByIdQueryHandler> _logger;

        public GetTransactionByIdQueryHandler(
            ITransactionRepository repository,
            IMapper mapper,
            ILogger<GetTransactionByIdQueryHandler> logger
        )
        {
            _repository = repository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<TransactionDto> Handle(
            GetTransactionByIdQuery request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Handling GetTransactionByIdQuery for TransactionId={TransactionId}",
                request.Id
            );

            try
            {
                var transaction = await _repository.GetByIdAsync(request.Id);
                if (transaction == null)
                {
                    _logger.LogWarning("Transaction not found: {TransactionId}", request.Id);
                    throw new Exception("Transaction not found");
                }

                _logger.LogInformation(
                    "Transaction retrieved successfully: {TransactionId}",
                    request.Id
                );
                return _mapper.Map<TransactionDto>(transaction);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error while handling GetTransactionByIdQuery for TransactionId={TransactionId}",
                    request.Id
                );
                throw;
            }
        }
    }
}
