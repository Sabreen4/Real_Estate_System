using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PropertyService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Initiali : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "Sabreen_PropertyServiceManagement");

            migrationBuilder.RenameTable(
                name: "users",
                schema: "Sabreen_RealEstate_Management",
                newName: "users",
                newSchema: "Sabreen_PropertyServiceManagement");

            migrationBuilder.RenameTable(
                name: "set_ref_terms",
                schema: "Sabreen_RealEstate_Management",
                newName: "set_ref_terms",
                newSchema: "Sabreen_PropertyServiceManagement");

            migrationBuilder.RenameTable(
                name: "ref_terms",
                schema: "Sabreen_RealEstate_Management",
                newName: "ref_terms",
                newSchema: "Sabreen_PropertyServiceManagement");

            migrationBuilder.RenameTable(
                name: "ref_sets",
                schema: "Sabreen_RealEstate_Management",
                newName: "ref_sets",
                newSchema: "Sabreen_PropertyServiceManagement");

            migrationBuilder.RenameTable(
                name: "property_images",
                schema: "Sabreen_RealEstate_Management",
                newName: "property_images",
                newSchema: "Sabreen_PropertyServiceManagement");

            migrationBuilder.RenameTable(
                name: "properties",
                schema: "Sabreen_RealEstate_Management",
                newName: "properties",
                newSchema: "Sabreen_PropertyServiceManagement");

            migrationBuilder.RenameTable(
                name: "offers",
                schema: "Sabreen_RealEstate_Management",
                newName: "offers",
                newSchema: "Sabreen_PropertyServiceManagement");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "Sabreen_RealEstate_Management");

            migrationBuilder.RenameTable(
                name: "users",
                schema: "Sabreen_PropertyServiceManagement",
                newName: "users",
                newSchema: "Sabreen_RealEstate_Management");

            migrationBuilder.RenameTable(
                name: "set_ref_terms",
                schema: "Sabreen_PropertyServiceManagement",
                newName: "set_ref_terms",
                newSchema: "Sabreen_RealEstate_Management");

            migrationBuilder.RenameTable(
                name: "ref_terms",
                schema: "Sabreen_PropertyServiceManagement",
                newName: "ref_terms",
                newSchema: "Sabreen_RealEstate_Management");

            migrationBuilder.RenameTable(
                name: "ref_sets",
                schema: "Sabreen_PropertyServiceManagement",
                newName: "ref_sets",
                newSchema: "Sabreen_RealEstate_Management");

            migrationBuilder.RenameTable(
                name: "property_images",
                schema: "Sabreen_PropertyServiceManagement",
                newName: "property_images",
                newSchema: "Sabreen_RealEstate_Management");

            migrationBuilder.RenameTable(
                name: "properties",
                schema: "Sabreen_PropertyServiceManagement",
                newName: "properties",
                newSchema: "Sabreen_RealEstate_Management");

            migrationBuilder.RenameTable(
                name: "offers",
                schema: "Sabreen_PropertyServiceManagement",
                newName: "offers",
                newSchema: "Sabreen_RealEstate_Management");
        }
    }
}
