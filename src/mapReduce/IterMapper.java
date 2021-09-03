package mapReduce;

import java.io.IOException;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

public class IterMapper extends Mapper<LongWritable, Text, Text, Text>
{
	//Receives fromNode		toNodes;weight;node,adsorpvalue, node, adsorpvalue etc.
	public void map(LongWritable key, Text value, Context context)
			throws IOException,InterruptedException {
		
		String line = value.toString();
		String[] parts = line.split("\t");
	
		String entity1 = parts[0];
		String[] data = parts[1].split(";");
		
		String[] links = data[0].split(",");
		String weight = data[1];
		
		String ranks = "";
		if (data.length > 2) {
			ranks = data[2];
		}
		
		for (int i = 0; i < links.length; i++) {
			//emit (toNode	IN;weight;userNode1,rank1,userNode2,rank2,...)
			context.write(new Text(links[i]), new Text("IN;"+weight+";"+ranks));
		}
		//emit (fromNode	OUT;links;weight)
		context.write(new Text(entity1), new Text("OUT;"+data[0]+";"+data[1]));
	}
}