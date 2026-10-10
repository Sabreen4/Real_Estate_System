using BookingService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Transactions.Commands
{
    public record UpdateTransactionStatusCommand(int Id, string Status, string token)
        : IRequest<Unit>;

    public class UpdateTransactionStatusCommandHandler
        : IRequestHandler<UpdateTransactionStatusCommand, Unit>
    {
        private readonly ITransactionRepository _repository;
        private readonly ILogger<UpdateTransactionStatusCommandHandler> _logger;
        private readonly IPropertyApi _propertyApi;

        public UpdateTransactionStatusCommandHandler(
            ITransactionRepository repository,
            ILogger<UpdateTransactionStatusCommandHandler> logger,
            IPropertyApi propertyApi
        )
        {
            _repository = repository;
            _logger = logger;
            _propertyApi = propertyApi;
        }

        public async Task<Unit> Handle(
            UpdateTransactionStatusCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Handling UpdateTransactionStatusCommand: TransactionId={TransactionId}, Status={Status}",
                request.Id,
                request.Status
            );

            var transaction = await _repository.GetByIdAsync(request.Id);
            if (transaction == null)
                throw new KeyNotFoundException("Transaction not found");

            var status = await _repository.GetStatusByKeyAsync(request.Status);
            if (status == null)
                throw new ArgumentException($"'{request.Status}' is not a valid status.");

            var currentStatus = transaction.Status?.Key;
            var newStatus = request.Status.ToUpper();

            if (currentStatus == "APPROVED")
                throw new InvalidOperationException("Transaction already completed");

            if (currentStatus == "PENDING" && (newStatus == "APPROVED" || newStatus == "REJECTED"))
            {
                transaction.StatusId = status.Id;
                await _repository.UpdateAsync(transaction);
                await _repository.SaveChangesAsync();
            }
            else
            {
                throw new InvalidOperationException("Invalid status transition");
            }

            if (newStatus == "APPROVED")
            {
                try
                {
                    await _propertyApi.MarkAsSold(transaction.PropertyId, request.token);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "CRITICAL: Transaction {Id} approved but Property {PropertyId} NOT marked sold.",
                        request.Id,
                        transaction.PropertyId
                    );
                }
            }

            return Unit.Value;
        }
    }
}
