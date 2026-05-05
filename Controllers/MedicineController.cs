using Microsoft.AspNetCore.Mvc;
using PharmacyApp.Models;
using System.Text.Json;

namespace PharmacyApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicineController : ControllerBase
    {
        private readonly string _jsonFilePath = "Data/medicines.json";

        // GET: api/medicine
        [HttpGet]
        public async Task<ActionResult<List<Medicine>>> GetAllMedicines()
        {
            try
            {
                var medicines = await ReadMedicinesFromFile();
                return Ok(medicines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // GET: api/medicine/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Medicine>> GetMedicine(int id)
        {
            var medicines = await ReadMedicinesFromFile();
            var medicine = medicines.FirstOrDefault(m => m.Id == id);

            if (medicine == null)
                return NotFound($"Medicine with ID {id} not found");

            return Ok(medicine);
        }

        // GET: api/medicine/search/para
        [HttpGet("search/{name}")]
        public async Task<ActionResult<List<Medicine>>> SearchMedicines(string name)
        {
            var medicines = await ReadMedicinesFromFile();
            var results = medicines.Where(m =>
                m.FullName.Contains(name, StringComparison.OrdinalIgnoreCase) ||
                m.Brand.Contains(name, StringComparison.OrdinalIgnoreCase)
            ).ToList();

            return Ok(results);
        }

        // POST: api/medicine
        [HttpPost]
        public async Task<ActionResult<Medicine>> AddMedicine([FromBody] Medicine medicine)
        {
            try
            {
                var medicines = await ReadMedicinesFromFile();

                // Generate new ID
                medicine.Id = medicines.Any() ? medicines.Max(m => m.Id) + 1 : 1;

                medicines.Add(medicine);
                await WriteMedicinesToFile(medicines);

                return CreatedAtAction(nameof(GetMedicine), new { id = medicine.Id }, medicine);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // PUT: api/medicine/5
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateMedicine(int id, [FromBody] Medicine medicine)
        {
            try
            {
                var medicines = await ReadMedicinesFromFile();
                var index = medicines.FindIndex(m => m.Id == id);

                if (index == -1)
                    return NotFound($"Medicine with ID {id} not found");

                medicine.Id = id;
                medicines[index] = medicine;
                await WriteMedicinesToFile(medicines);

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // POST: api/medicine/5/sale?quantity=2
        [HttpPost("{id}/sale")]
        public async Task<ActionResult> RecordSale(int id, [FromQuery] int quantity)
        {
            try
            {
                var medicines = await ReadMedicinesFromFile();
                var medicine = medicines.FirstOrDefault(m => m.Id == id);

                if (medicine == null)
                    return NotFound($"Medicine with ID {id} not found");

                if (medicine.Quantity < quantity)
                    return BadRequest("Insufficient quantity in stock");

                medicine.Quantity -= quantity;
                await WriteMedicinesToFile(medicines);

                return Ok(new { message = "Sale recorded successfully", remainingQuantity = medicine.Quantity });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // Helper Methods
        private async Task<List<Medicine>> ReadMedicinesFromFile()
        {
            if (!System.IO.File.Exists(_jsonFilePath))
                return new List<Medicine>();

            var jsonData = await System.IO.File.ReadAllTextAsync(_jsonFilePath);
            return JsonSerializer.Deserialize<List<Medicine>>(jsonData) ?? new List<Medicine>();
        }

        private async Task WriteMedicinesToFile(List<Medicine> medicines)
        {
            var options = new JsonSerializerOptions { WriteIndented = true };
            var jsonData = JsonSerializer.Serialize(medicines, options);
            await System.IO.File.WriteAllTextAsync(_jsonFilePath, jsonData);
        }
    }
}