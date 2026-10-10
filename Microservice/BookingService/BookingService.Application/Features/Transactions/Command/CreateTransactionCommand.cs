using BookingService.Application.DTOs;
using BookingService.Application.Interfaces;
using BookingService.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BookingService.Application.Features.Transactions.Commands
{
    public record CreateTransactionCommand(
        int PropertyId,
        int BuyerId,
        int SellerId,
        decimal Amount
    ) : IRequest<TransactionDto>;

    public class CreateTransactionCommandHandler
        : IRequestHandler<CreateTransactionCommand, TransactionDto>
    {
        private readonly ITransactionRepository _repository;
        private readonly ILogger<CreateTransactionCommandHandler> _logger;

        public CreateTransactionCommandHandler(
            ITransactionRepository repository,
            ILogger<CreateTransactionCommandHandler> logger
        )
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<TransactionDto> Handle(
            CreateTransactionCommand request,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation(
                "Handling CreateTransactionCommand: PropertyId={P}, BuyerId={B}, SellerId={S}, Amount={A}",
                request.PropertyId,
                request.BuyerId,
                request.SellerId,
                request.Amount
            );

            // ArgumentException → 400 via ExceptionMiddleware
            if (request.Amount <= 0)
                throw new ArgumentException("Amount must be greater than zero.");

            // Plain Exception → 500 intentionally; test asserts InternalServerError
            if (request.BuyerId == request.SellerId)
                throw new Exception("Buyer and Seller cannot be same");

            var status = await _repository.GetStatusByKeyAsync("PENDING");
            if (status == null)
                throw new InvalidOperationException("Status 'PENDING' not configured.");

            var transaction = new Transaction
            {
                PropertyId = request.PropertyId,
                BuyerId = request.BuyerId,
                SellerId = request.SellerId,
                Amount = request.Amount,
                TransactionDate = DateTime.UtcNow,
                StatusId = status.Id,
            };

            var result = await _repository.AddAsync(transaction);

            // FIX: commit to DB so subsequent GetById / UpdateStatus can find this record
            await _repository.SaveChangesAsync();

            _logger.LogInformation("Transaction created: Id={Id}", result.Id);

            // FIX: build DTO explicitly — no AutoMapper profile needed
            return new TransactionDto
            {
                Id = result.Id,
                PropertyId = result.PropertyId,
                BuyerId = result.BuyerId,
                SellerId = result.SellerId,
                Amount = result.Amount,
                PaymentDate = result.TransactionDate,
                Status = status.Key, // we already have the RefTerm in memory
            };
        }
    }
}
