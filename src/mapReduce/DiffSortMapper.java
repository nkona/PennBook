package mapReduce;

import java.io.IOException;

import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

//Emits keys-value pairs with (1, difference)
public class DiffSortMapper extends Mapper<LongWritable, Text, IntWritable, DoubleWritable>
{
	public void map(LongWritable key, Text value,Context context)
			throws IOException,InterruptedException {
		
		String line = value.toString();
		String[] values = line.split("\t");
		
		double diff = Double.parseDouble(values[1]);
		context.write( new IntWritable(1), new DoubleWritable(diff) );	
	}
}